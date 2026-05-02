import { Link } from 'react-router-dom';

import { GitHubIcon } from '@assets/index';

const API_URL = import.meta.env.VITE_API_URL;

export const Footer = () => {
  return (
    <div style={{ padding: '0 20px 10px 20px' }}>
      <div className="row all-center">
        <Link className="link" to="https://github.com/VeronikaSukhonos/webster" target="blank">
          <GitHubIcon />
        </Link>
        <Link className="link" to={`${API_URL}/docs`} target="blank">
          API
        </Link>
      </div>
      <div className="row hor-center" style={{ fontSize: '0.95rem' }}>
        © SketCherry, 2026
      </div>
    </div>
  );
};
