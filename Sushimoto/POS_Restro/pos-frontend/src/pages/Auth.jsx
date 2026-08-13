import { useEffect } from "react";
import restaurant from "../assets/images/restaurant-img.jpg";
import logo from "../assets/images/logo.png";
import Login from "../components/auth/Login";

const Auth = () => {
  useEffect(() => {
    document.title = "Sushimoto | Auth";
  }, []);

  return (
    <div className="flex min-h-screen w-full bg-creamson">
      {/* Left Section — Image Panel */}
      <div className="w-1/2 relative flex items-center justify-center overflow-hidden">
        <img className="w-full h-full object-cover" src={restaurant} alt="Restaurant" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
        <blockquote className="absolute bottom-12 px-10 text-left" data-aos="fade-right">
          <p className="text-2xl md:text-3xl italic text-white/90 font-body leading-relaxed">
            "Serve customers the best food with prompt and friendly service in a
            welcoming atmosphere."
          </p>
          <span className="block mt-5 text-primary font-heading font-semibold text-lg">
            — Founder of Sushimoto
          </span>
        </blockquote>
      </div>

      {/* Right Section — Form Panel */}
      <div className="w-1/2 min-h-screen bg-white flex flex-col justify-center px-16 py-10">
        <div className="flex flex-col items-center gap-3 mb-8" data-aos="fade-down">
          <div className="bg-primary/10 p-3 rounded-full">
            <img src={logo} alt="Sushimoto Logo" className="h-14 w-14" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-secondary">
            <span className="text-primary">Sushi</span>moto
          </h1>
        </div>

        <h2
          className="text-3xl text-center font-heading font-semibold text-secondary mb-8"
          data-aos="fade-up"
        >
          Welcome Back
        </h2>
        <p className="text-center text-muted-foreground font-body text-sm -mt-6 mb-8">
          Sign in to your account
        </p>

        <Login />
      </div>
    </div>
  );
};

export default Auth;
