// simple LinkedIn login button that redirects to backend auth route
import linkedin from "react-linkedin-login-oauth2/assets/linkedin.png";
import API_CONFIG from "../../utils/apiConstant";

export default function LinkedinLogin() {
  const handleLogin = () => {
    const target = `${API_CONFIG.API_ENDPOINT}/api/auth/linkedin/login`;
    // Redirect to backend LinkedIn OAuth flow using the same API endpoint as the rest of the app
    window.location.href = target;
  };

  return (
    <img
      onClick={handleLogin}
      src={linkedin}
      alt="Sign in with LinkedIn"
      role="button"
      style={{ maxWidth: "180px", cursor: "pointer" }}
    />
  );
}
