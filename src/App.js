import logo from './logo.svg';
import './App.css';
import Hello from './pages/hello';
import { Route, Routes } from 'react-router-dom';

// import Molstar from 'molstar-react';
function App() {
  return (
    <Routes>
      <Route path="/protein-demo" element={<Hello />} />
      
    </Routes>
  );
}

export default App;
