const Footer = () => {
  return (
    <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center pb-10">
      <a
        className="flex items-center gap-2 hover:underline hover:underline-offset-4"
        href="/"
        target="_blank"
        rel="noopener noreferrer"
      >
        How it works
      </a>
      <a
        className="flex items-center gap-2 hover:underline hover:underline-offset-4"
        href="/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Terms and conditions
      </a>
      <a
        className="flex items-center gap-2 hover:underline hover:underline-offset-4"
        href="https://github.com/IvayloAtanasov/sunday-v2-web"
        target="_blank"
        rel="noopener noreferrer"
      >
        Source
      </a>
    </footer>
  );
};

export default Footer;
