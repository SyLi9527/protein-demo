import React, { useEffect, useRef, useState } from "react";
import PropTypes, { func } from "prop-types";
import { DefaultPluginSpec } from "molstar/lib/mol-plugin/spec";
import { DefaultPluginUISpec } from "molstar/lib/mol-plugin-ui/spec";
import { createPluginUI } from "molstar/lib/mol-plugin-ui/index";
import { PluginContext } from "molstar/lib/mol-plugin/context";
import "molstar/build/viewer/molstar.css";
import { ParamDefinition } from "molstar/lib/mol-util/param-definition";
import { CameraHelperParams } from "molstar/lib/mol-canvas3d/helper/camera-helper";
import { ScreenshotPreview } from 'molstar/lib/mol-plugin-ui/controls/screenshot';
import { useBehavior } from 'molstar/lib/mol-plugin-ui/hooks/use-behavior';
import { ParameterControls } from 'molstar/lib/mol-plugin-ui/controls/parameters';
import { PluginCommands } from 'molstar/lib/mol-plugin/commands';
import { Color } from 'molstar/lib/mol-util/color';
import { Asset } from 'molstar/lib/mol-util/assets';
import { changeCameraRotation, structureLayingTransform } from 'molstar/lib/mol-plugin-state/manager/focus-camera/orient-axes';
import { Mat3 } from "molstar/lib/mol-math/linear-algebra";
import { ColorOptions } from "./ColorOptions";
import { OutlineOptions } from "./OutlineOptions";

const Molstar = props => {

  const { useInterface, pdbId, url, file, dimensions, className, showControls, showAxes } = props;
  const parentRef = useRef(null);
  const canvasRef = useRef(null);
  const plugin = useRef(null);
  const [initialized, setInitialized] = useState(false);
  const originalSnapshot = useRef(null);
  const structureRef = useRef(null);
  const trajRef = useRef(null);

  useEffect(() => {
    (async () => {
      if (useInterface) {
        const spec = DefaultPluginUISpec();
        spec.layout = {
          initial: {
            isExpanded: false,
            controlsDisplay: "reactive",
            showControls,
          }
        };
        plugin.current = await createPluginUI(parentRef.current, spec);
      } else {
        plugin.current = new PluginContext(DefaultPluginSpec());
        plugin.current.initViewer(canvasRef.current, parentRef.current);
        await plugin.current.init();
      }
      
      if (!showAxes) {
        plugin.current.canvas3d?.setProps({ camera: { helper: { axes: {
          name: "off", params: {}
        } } } });
      }

      await loadStructure(pdbId, url, file, plugin.current);
      setBackground(0xcccccc, plugin.current);
      await stylized();

      console.log(plugin.current);
      // console.log(plugin.current.canvas3d?.camera);
      
      setInitialized(true);
  
    })();
    return () => plugin.current = null;
  }, [])

  useEffect(() => {
    // bypass the default camera orientation
    if (!initialized) return;
    PluginCommands.Camera.ResetAxes(plugin.current);
    originalSnapshot.current = plugin.current.canvas3d?.camera.getSnapshot();
    // console.log(plugin.current.canvas3d?.camera.getSnapshot());
  }, [initialized])

  // useEffect(() => {
  //   if (!initialized) return;
  //   (async() => {
  //     await loadStructure(pdbId, url, file, plugin.current);
  //   })();
  // }, [pdbId, url, file])


  useEffect(() => {
    if (plugin.current) {
      if (!showAxes) {
        plugin.current.canvas3d?.setProps({ camera: { helper: { axes: {
          name: "off", params: {}
        } } } })
      } else {
        plugin.current.canvas3d?.setProps({ camera: { helper: {
          axes: ParamDefinition.getDefaultValues(CameraHelperParams).axes
        } } })
      }
    }
  }, [showAxes]) 

  const setBackground = (color, plugin) => {
    PluginCommands.Canvas3D.SetSettings(plugin, { settings: props => { props.renderer.backgroundColor = Color(color); } });
}

  const loadStructure = async (pdbId, url, file, plugin) => {
    if (plugin) {
      plugin.clear();
      if (file) {
        const data = await plugin.builders.data.rawData({
          data: file.filestring
        });
        const traj = await plugin.builders.structure.parseTrajectory(data, file.type);
        await plugin.builders.structure.hierarchy.applyPreset(traj, "default");
      } else {
        let extension;
        if (url) {
          if (url.includes("rcsb.org")) {
            extension = url.split(".").pop().replace("cif", "mmcif");
          } else if (url.includes("swissmodel")) {
            extension = "pdb";
          } else if (url.includes("modelarchive")) {
            extension = "mmcif";
          } else if (url.includes("pubchem")) {
            extension = "mol";
          }
        }
        const structureUrl = url ? url : pdbId ? `https://files.rcsb.org/view/${pdbId}.cif` : null;
        if (!structureUrl) return;
        const data = await plugin.builders.data.download(
          { url: structureUrl }, {state: {isGhost: true}}
        );
        // let extension = structureUrl.split(".").pop().replace("cif", "mmcif");
        // if (url && url.includes("rcsb.org")) {
        //     extension = structureUrl.split(".").pop().replace("cif", "mmcif");
        // } else {
        //     extension = structureUrl.split(".").pop()
        // }
        if (extension.includes("?"))
          extension = extension.substring(0, extension.indexOf("?"));
        const traj = await plugin.builders.structure.parseTrajectory(data, extension);
        trajRef.current = traj;
        const model = await plugin.builders.structure.createModel(traj);
        const structure = await plugin.builders.structure.createStructure(model);
        structureRef.current = structure;
        await plugin.builders.structure.hierarchy.applyPreset(traj, "default");
        
        const componentGroups = plugin.managers.structure.hierarchy.currentComponentGroups;
        for (const group of componentGroups) {
            let repr = group[0].representations[0];
            if (repr.component.cell.obj.label === "Water") {
                // hide water layer
                await plugin.managers.structure.hierarchy.toggleVisibility(group, 'hide');
                // remove water layer
                // await plugin.managers.structure.hierarchy.remove(group, true);
            }
            
        }
      }
    }
  }

  async function stylized() {
    
    plugin.current.managers.structure.component.setOptions({ ...plugin.current.managers.structure.component.state.options, ignoreLight: true });

    if (plugin.current.canvas3d) {
        console.log(plugin.current.canvas3d.props);

        const pp = plugin.current.canvas3d.props.postprocessing;
        plugin.current.canvas3d.setProps({
            camera: 
              {    
                "fov": 45,
                // "manualReset": false
            },
            cameraClipping: { far: true, radius: 1.1, minNear: 5 },
            cameraFog: { name: 'off', params: {} },
            postprocessing: {
                outline: {
                    name: 'on',
                    params: pp.outline.name === 'on'
                        ? pp.outline.params
                        : {
                            scale: 1,
                            color: Color(0x000000),
                            threshold: 0.33,
                            includeTransparent: true,
                        }
                },
                occlusion: {
                    name: 'on',
                    params: pp.occlusion.name === 'on'
                        ? pp.occlusion.params
                        : {
                            multiScale: { name: 'off', params: {} },
                            radius: 5,
                            bias: 0.8,
                            blurKernelSize: 15,
                            samples: 32,
                            resolutionScale: 1,
                            color: Color(0x000000),
                        }
                },
                shadow: { name: 'off', params: {} },
            }
        });
    }
  }


  const width = dimensions ? dimensions[0] : "100%";
  const height = dimensions ? dimensions[1] : "100%";

  var defaultAxes = {
    "alpha": 0.9,
    "colorX": 16711680,
    "colorY": 32768,
    "colorZ": 255,
    "scale": 0.11,
    "location": "bottom-left",
    "locationOffsetX": 0,
    "locationOffsetY": 0,
    "originColor": 8421504,
    "radiusScale": 0.075,
    "showPlanes": true,
    "planeColorXY": 8421504,
    "planeColorXZ": 8421504,
    "planeColorYZ": 8421504,
    "showLabels": false,
    "labelX": "X",
    "labelY": "Y",
    "labelZ": "Z",
    "labelColorX": 8421504,
    "labelColorY": 8421504,
    "labelColorZ": 8421504,
    "labelOpacity": 1,
    "labelScale": 0.25
  }

  function updateValues(e, name, values) {
    const helper = plugin.current.helpers.viewportScreenshot;
    console.log(helper)
    if (name === "transparent") {
        helper.behaviors.values.next({ ...values, transparent: e.target.value === "on" });
    } else if (name === "axes") {
        helper.behaviors.values.next({ ...values, axes: { name: e.target.value, params: defaultAxes } });
    } else if (name === "resolution") {
        // console.log(e.target)
        if (e.target.value === "free") {
            helper.behaviors.values.next({ ...values, resolution: { name: "custom", params: { width: 300, height: 300 } } });
        } else if (e.target.value === "custom") {
            alert("Not implemented");
        } else {
            helper.behaviors.values.next({ ...values, resolution: { name: e.target.value, params: {} } });
        }
       
    }
  }

  const downloadPng = () => {
    if (plugin.current) {
      plugin.current.helpers.viewportScreenshot?.download();
    }
 }

  const resetZoom = () => {
    if (plugin.current) {
      PluginCommands.Camera.Reset(plugin.current, {});
      // const newSnapshot = originalSnapshot.current;
      // reset(newSnapshot, 1000);
      // console.log(plugin.current.canvas3d.camera.getSnapshot())
    }
  }

  const reset = (snapshot, durationMs) => {
    plugin.current.canvas3d?.requestCameraReset({ snapshot, durationMs });
  }

  const setSnapshot = (snapshot, durationMs) => {
    // TODO: setState and requestCameraReset are very similar now: unify them?
    plugin.current.canvas3d?.requestCameraReset({ snapshot, durationMs });
  }

  const resetAxes = (durationMs) => {
    if (!plugin.current.canvas3d) return;
    const newSnapshot = changeCameraRotation(plugin.current.canvas3d.camera.getSnapshot(), Mat3.Identity);
    setSnapshot(newSnapshot, durationMs);
  }

  const resetDefault = async() => {
    if (plugin.current && plugin.current.canvas3d) {

      // resetAxes(1000);
      setSnapshot(originalSnapshot.current, 1500);
      // console.log(plugin.current.canvas3d.camera.getSnapshot())
      // PluginCommands.Camera.ResetAxes(plugin.current);

    }
  }

  const resetOrientation = () => {
    if (plugin.current) {
      PluginCommands.Camera.OrientAxes(plugin.current);
    }
  }

  const  ScreenshotParams = ({ plugin, isDisabled }) =>  {
    const helper = plugin.helpers.viewportScreenshot;

    const values = useBehavior(helper?.behaviors.values);
    // console.log(helper.params)
    // {
    //     "transparent": false,
    //     "axes": {
    //         "name": "off",
    //         "params": {}
    //     },
    //     "resolution": {
    //         "name": "viewport",
    //         "params": {}
    //     }
    // }
    // console.log(values)
    if (!helper) return null;

    return (
        <div>
            <div>Transparent</div>
            <select onChange={e => updateValues(e, "transparent", values)}>
                <option value="off">off</option>
                <option value="on">on</option> 
            </select>
            <div>axes</div>
            <select onChange={e => updateValues(e, "axes", values)}>
                <option value="off">off</option>
                <option value="on">on</option> 
            </select>
            <div>resolution</div>
            <select defaultValue="free" onChange={e => updateValues(e, "resolution", values)}>
                <option value="free">free</option>
                <option value="viewport">viewport</option>
                <option value="hd">HD</option> 
                <option value="full-hd">Full HD</option> 
                <option value="ultra-hd">Ultra HD</option> 
            </select>
            <button onClick={downloadPng}>download</button>

        </div>
    )
       
    // return <div>
    //     <ParameterControls params={helper.params} values={values} onChangeValues={v => helper.behaviors.values.next(v)} isDisabled={isDisabled} />
    //     <button onClick={downloadPng}>download</button>
    //     </div>
    
  }

  if (useInterface) {
    return (
      <div style={{position: "absolute", width, height, overflow: "hidden"}}>
        <div ref={parentRef} style={{position: "absolute", left: 0, top: 0, right: 0, bottom: 0}} />
      </div>
    )
  }

  return (
    <div
      ref={parentRef}
      style={{position: "relative", width, height}}
      className={className || ""}
    >
      { initialized && 
        <div style={{ height: 300}}>
            <ScreenshotPreview plugin={plugin.current} cropFrameColor="#0052D9AA" />
            <button onClick={resetZoom}>reset zoom</button>
            <button onClick={resetDefault}>reset to default</button>
            <button onClick={resetOrientation}>reset orientation</button>
            <ScreenshotParams plugin={plugin.current} isDisabled={!plugin.current.state.data.behaviors.isUpdating}/>
            <ColorOptions plugin={plugin.current} structure={structureRef.current} />
            <OutlineOptions plugin={plugin.current}/>
        </div>
      }
      <canvas
        ref={canvasRef}
        style={{position: "absolute", left:600, top: 0}}
    
      />
    </div>
  );
};

Molstar.propTypes = {
  useInterface: PropTypes.bool,
  pdbId: PropTypes.string,
  url: PropTypes.string,
  file: PropTypes.object,
  dimensions: PropTypes.array,
  showControls: PropTypes.bool,
  showAxes: PropTypes.bool,
  className: PropTypes.string
};

export default Molstar;