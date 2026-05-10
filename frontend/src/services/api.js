import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:8000' });

export const getPrediction = async (blob) => {
  const fd = new FormData();
  fd.append('file', blob, 'image.jpg');
  const r = await API.post('/predict', fd);
  return r.data;
};

export const detectFaces = async (blob) => {
  const fd = new FormData();
  fd.append('file', blob, 'frame.jpg');
  const r = await API.post('/detect', fd);
  return r.data;  // { faces: [{x,y,w,h}, ...] }
};

export const getHealth = async () => {
  const r = await API.get('/');
  return r.data;
};
