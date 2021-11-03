import { Route, Redirect, Switch } from "react-router-dom";
import { useMain } from "./context/contextProvider";
import Page1 from "./view/Page1";

const Routes = () => {
  const { cv } = useMain();

  if (!cv)
    return (
      <div style={{ display: "flex", justifyContent: "center" }}>
        <h1>Loading OpenCV...</h1>
      </div>
    );
  return (
    <Switch>
      <Route exact path="/" component={Page1} />
      <Redirect exact from="/*" to="/" />
    </Switch>
  );
};

export default Routes;
