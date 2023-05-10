import { useState } from "react";
import { Color } from 'molstar/lib/mol-util/color';

export function OutlineOptions({plugin}) {
    const [outline, setOutline] = useState("op1");
    
    const changeOutline = (outline) => {
        setOutline(outline);
        const pp = plugin.canvas3d.props.postprocessing;
        switch (outline) {
            case "no":
                plugin.canvas3d.setProps({
                    postprocessing: {
                        outline: {
                            name: 'off',
                            params: pp.outline.params
                                
                        },
                    }
                })
                break;
            case "op1":
                plugin.canvas3d.setProps({
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
                    }
                })
                break;
            case "op2":
                plugin.canvas3d.setProps({
                    postprocessing: {
                        outline: {
                            name: 'on',
                            params:  {
                                    scale: 3,
                                    color: Color(0x000000),
                                    threshold: 0.33,
                                    includeTransparent: true,
                                }
                        },
                    }
                })
                break;
            case "op3":
                plugin.canvas3d.setProps({
                    postprocessing: {
                        outline: {
                            name: 'on',
                            params:  {
                                    scale: 3,
                                    color: Color(0xff0000),
                                    threshold: 0.5,
                                    includeTransparent: true,
                                }
                        },
                    }
                })
                break;
            default:
                break;
        }
    }
    return (
        <div>
            <div>
                outline options
            </div>
            <select name="" id="" onChange={e => changeOutline(e.target.value)} defaultValue={"op1"}>
                <option value="no">no outline</option>
                <option value="op1">outline 1</option>
                <option value="op2">outline 2</option>
                <option value="op3">outline 3</option>
            </select> 
        </div>
    )
}