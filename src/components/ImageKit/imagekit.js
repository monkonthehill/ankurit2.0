// src/providers/ImageKitProvider.js
import { IKContext } from 'imagekitio-react';
import PropTypes from 'prop-types';

const ImageKitProvider = ({ children }) => {
  return (
    <IKContext
      urlEndpoint={process.env.REACT_APP_IMAGEKIT_URL_ENDPOINT}
      publicKey={process.env.REACT_APP_IMAGEKIT_PUBLIC_KEY}
      authenticationEndpoint={process.env.REACT_APP_IMAGEKIT_AUTH_ENDPOINT}
    >
      {children}
    </IKContext>
  );
};

ImageKitProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ImageKitProvider;