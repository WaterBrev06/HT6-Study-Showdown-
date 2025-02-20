import React from 'react';

const Button = ({ buttonName, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="font-brkreg transition duration-250 border-4 border-black bg-white px-8 py-4 text-4xl tracking-wide text-black ease-in-out hover:border-white hover:bg-black hover:text-white"
    >
      {buttonName}
    </button>
  );
};

export default Button;
