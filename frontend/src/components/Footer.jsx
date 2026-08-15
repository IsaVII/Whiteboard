const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="text-center text-sm text-gray-500 py-4">
      © {currentYear} All rights reserved.
    </footer>
  );
};

export default Footer;
