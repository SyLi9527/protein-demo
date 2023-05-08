import { useEffect, useRef, useState } from "react"
import Molstar from "./Molstar"
// import Molstar from "molstar-react"
// import { useEffect } from "react"



export default function Hello() {
  const pdbIdList = ['6vvw', '8j0y', '8dmn', '7VPX', '8b05']
  const [index, setIndex] = useState(0)
  const idRef = useRef(null)
  const [url, setUrl] = useState(`https://files.rcsb.org/view/6vvw.cif`)
  const [ready, setReady] = useState(false)
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setIndex((index + 1) % pdbIdList.length)

  //   }, 5000)
  //   return () => clearInterval(interval)
  // }, [index])

  const changeType = (type) => {
    if (ready) setReady(false)
    const id = idRef.current.value
    console.log(type)

    if (type === 'pdb') {
      console.log(1)  
      setUrl(`https://files.rcsb.org/view/${id}.cif`);
    } else if (type === 'pdb-dev') {
      
      const nId = id.toUpperCase().startsWith('PDBDEV_') ? id : `PDBDEV_${id.padStart(8, '0')}`;
      setUrl(`https://pdb-dev.wwpdb.org/cif/${nId.toUpperCase()}.cif`)
      // console.log(`https://pdb-dev.wwpdb.org/bcif/${nId.toUpperCase()}.bcif`)       
      // setUrl(`https://pdb-dev.wwpdb.org/cif/${nId.toUpperCase()}.cif`);
                       
    } else if (type === 'swissmodel') {
      console.log(3)
      setUrl(`https://swissmodel.expasy.org/repository/uniprot/${id.toUpperCase()}.pdb`)

    } else if (type === 'alphafolddb') {
      console.log(4)
      setUrl(`https://alphafold.ebi.ac.uk/files/AF-${id.toUpperCase()}-F1-model_v1.pdb`)
      // setUrl(`https://www.alphafold.ebi.ac.uk/api/prediction/${id.toUpperCase()}`)
    } else if (type === 'modelarchive') {
      setUrl(`https://www.modelarchive.org/doi/10.5452/${id.toLowerCase()}.cif`)
    } else if (type === 'pubchem') {
      setUrl(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/CID/${id.trim()}/record/SDF/?record_type=3d`)
    }
  }

  useEffect(() => {
    console.log(idRef.current.value)
  }, [idRef])

  return (
    <div>
        <p>
            Hello, world!
        </p>
        <div style={{ width: '600px',  height: '600px' }}>
          <select defaultValue="pdb-dev" name="protein type" id="" onChange={e => changeType(e.target.value)}>
            <option value="pdb-dev">pdb-dev</option>
            <option value="pdb">pdb</option>
            
            <option value="swissmodel">swissmodel</option>
            <option value="alphafolddb">alphafolddb</option>
            <option value="modelarchive">modelarchive</option>
            <option value="pubchem">pubchem</option>

          </select>
          <input type="text" ref={idRef}/>
          <button onClick={() => setReady(true)}>ready</button>
          {ready ? <Molstar pdbId={pdbIdList[index]} useInterface={false} url={url}  /> : null}
        </div>
    </div>
  )
}
