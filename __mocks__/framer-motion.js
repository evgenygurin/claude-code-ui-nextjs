const React = require('react');

const MotionComponent = ({ children, ...props }) => {
  return React.createElement('div', props, children);
};

const motion = new Proxy({}, {
  get() {
    return MotionComponent;
  }
});

const AnimatePresence = ({ children }) => {
  return children;
};

const useAnimation = () => ({
  start: jest.fn(),
  stop: jest.fn(),
  set: jest.fn(),
});

const useMotionValue = () => ({
  get: () => 0,
  set: jest.fn(),
});

const useTransform = () => 0;
const useSpring = () => 0;

module.exports = {
  motion,
  AnimatePresence,
  useAnimation,
  useMotionValue,
  useTransform,
  useSpring,
};