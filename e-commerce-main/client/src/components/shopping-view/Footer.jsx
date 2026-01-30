import { motion } from "framer-motion";
import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaLinkedinIn,
  FaMobileAlt,
  FaWallet,
  FaMoneyBillWave,
  FaUniversity,
  FaCreditCard,
} from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-gray-100 text-gray-800 py-14 border-t border-gray-200 mt-20">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-4 md:grid-cols-2 sm:grid-cols-1 gap-10">
        {/* Brand Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold mb-3 text-gray-900">Shoply</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-6">
            Shop smarter, live better. Discover quality products made just for
            you.
          </p>

          <div className="flex space-x-4 mt-3">
            {[
              { icon: <FaFacebookF />, link: "#" },
              { icon: <FaInstagram />, link: "#" },
              { icon: <FaTwitter />, link: "#" },
              { icon: <FaLinkedinIn />, link: "#" },
            ].map((social, index) => (
              <motion.a
                key={index}
                href={social.link}
                whileHover={{ scale: 1.15, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gray-200 hover:bg-gray-300 p-3 rounded-full text-gray-700 transition-all"
              >
                {social.icon}
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          viewport={{ once: true }}
        >
          <h3 className="text-xl font-semibold mb-4 text-gray-900">
            Quick Links
          </h3>
          <ul className="space-y-2 text-gray-700">
            <li>
              <a href="/" className="hover:text-gray-900 transition">
                Home
              </a>
            </li>
            <li>
              <a href="/shop" className="hover:text-gray-900 transition">
                Shop
              </a>
            </li>
            <li>
              <a href="/about" className="hover:text-gray-900 transition">
                About Us
              </a>
            </li>
            <li>
              <a href="/contact" className="hover:text-gray-900 transition">
                Contact
              </a>
            </li>
          </ul>
        </motion.div>

        {/* Customer Support */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          viewport={{ once: true }}
        >
          <h3 className="text-xl font-semibold mb-4 text-gray-900">
            Customer Support
          </h3>
          <ul className="space-y-2 text-gray-700">
            <li>
              <a href="#" className="hover:text-gray-900 transition">
                FAQs
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-gray-900 transition">
                Shipping Policy
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-gray-900 transition">
                Return Policy
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-gray-900 transition">
                Privacy Policy
              </a>
            </li>
          </ul>
        </motion.div>

        {/* Newsletter */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.7 }}
          viewport={{ once: true }}
        >
          <h3 className="text-xl font-semibold mb-4 text-gray-900">
            Join Our Newsletter
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Get updates about our latest products and exclusive offers.
          </p>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex items-center bg-white border border-gray-300 rounded-full overflow-hidden"
          >
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-grow px-4 py-2 outline-none text-sm text-gray-700"
            />
            <button
              type="submit"
              className="bg-gray-800 text-white px-4 py-2 text-sm font-medium hover:bg-gray-700 transition"
            >
              Subscribe
            </button>
          </form>
        </motion.div>
      </div>

      {/* Bottom Section */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1 }}
        viewport={{ once: true }}
        className="mt-12 text-center border-t border-gray-300 pt-6"
      >
        <div className="flex justify-center space-x-6 mb-3 text-gray-600 text-3xl">
          <FaMobileAlt
            className="hover:text-pink-500 w-7 h-7 transition-transform transform hover:scale-110"
            title="bKash"
          />
          <FaWallet
            className="hover:text-orange-500 w-7 h-7 transition-transform transform hover:scale-110"
            title="Nagad"
          />
          <FaMoneyBillWave
            className="hover:text-purple-500 w-7 h-7 transition-transform transform hover:scale-110"
            title="Rocket"
          />
          <FaUniversity
            className="hover:text-blue-500 w-7 h-7 transition-transform transform hover:scale-110"
            title="City Bank"
          />
          <FaCreditCard
            className="hover:text-green-500 w-7 h-7 transition-transform transform hover:scale-110"
            title="BRAC Bank"
          />
        </div>
        <p className="text-sm text-gray-500">
          © {new Date().getFullYear()}{" "}
          <span className="font-semibold text-gray-800">Shoply</span> — All
          Rights Reserved.
        </p>
      </motion.div>
    </footer>
  );
};

export default Footer;
