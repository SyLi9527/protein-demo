

export  function ColorOptions(props) {
    const { plugin, structure } = props;
    
    

    const changeColor = async(color) => {

       
        const componentGroups = plugin.managers.structure.hierarchy.currentComponentGroups;
        // let repr = componentGroups[0][0].representations[0];
        const mng = plugin.managers.structure.component;
        
        // for (const group of componentGroups.slice(1)) {
        //     await plugin.managers.structure.hierarchy.remove(group, true);
        // }
        // const polymer = await plugin.builders.structure.tryCreateComponentStatic(structure, 'Polymer');
        // if (polymer) await plugin.builders.structure.representation.addRepresentation(polymer, { type: 'ball-and-stick', color: 'element-symbol', colorParams: { carbonColor: { name: 'element-symbol', params: {} } } });

        switch (color) {
            case "uniform":
                mng.updateRepresentationsTheme(componentGroups[0], { color: 'uniform' });
                break;
            case "uncertainty":
                mng.updateRepresentationsTheme(componentGroups[0], { color: 'uncertainty' });
                break;
            case "seqence":
                mng.updateRepresentationsTheme(componentGroups[0], { color: 'sequence-id' });
                break;
            case "secondary str.":
                mng.updateRepresentationsTheme(componentGroups[0], { color: 'secondary-structure' });
                break;
            case "hydrophobicity":
                mng.updateRepresentationsTheme(componentGroups[0], { color: 'hydrophobicity' });
                break;
            case "temperature":
                alert("not implemented");
                break;
            case "molecule":
                mng.updateRepresentationsTheme(componentGroups[0], { color: 'molecule-type' });
                break;
            case "chain":
                mng.updateRepresentationsTheme(componentGroups[0], { color: 'chain-id' });
                break;
            case "element":
                mng.updateRepresentationsTheme(componentGroups[0], { color: 'element-symbol' });
                break;
            case "residue":
                mng.updateRepresentationsTheme(componentGroups[0], { color: 'residue-name' });
                break;
            default:
                break;
        }
    }

    return (
        <div>
            <div>
                color options
            </div>
            <select name="color_options" id="" onChange={e => changeColor(e.target.value)} defaultValue={"uniform"}>
                <option value="uniform">uniform</option>
                <option value="uncertainty">uncertainty</option>
                <option value="seqence">sequence</option>
                <option value="secondary str.">secondary str.</option>
                <option value="hydrophobicity">hydrophobicity</option>
                <option value="temperature">temperature</option>
                <option value="molecule">molecule</option>
                <option value="chain">chain</option>
                <option value="element">element</option>
                <option value="residue">residue</option>
            </select>
        </div>
    )
}