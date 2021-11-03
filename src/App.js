import { BrowserRouter } from "react-router-dom";
import ContextProvider from "./context/contextProvider";
import Routes from "./Routes";

function App() {
  return (
    <BrowserRouter>
      <ContextProvider>
        <Routes />
      </ContextProvider>
    </BrowserRouter>
  );
}

export default App;
