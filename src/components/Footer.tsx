import React from 'react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container">&copy; {currentYear} tennis-base.net</div>
    </footer>
  );
};
