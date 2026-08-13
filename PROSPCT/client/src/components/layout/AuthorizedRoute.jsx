import { Outlet } from "react-router-dom";

/**
 * AuthorizedRoute - Always allows access to auth pages.
 * Both user and admin can login simultaneously without conflicts.
 * Each dashboard checks its own token independently.
 */
const AuthorizedRoute = () => {
  // No redirects - just render the auth pages
  return <Outlet />;
};

export default AuthorizedRoute;
