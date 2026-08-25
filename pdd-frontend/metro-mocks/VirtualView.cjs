const React = require('react');

const VirtualViewMode = {
  Visible: 0,
  Prerender: 1,
  Hidden: 2,
};

const VirtualViewRenderState = {
  Unknown: 0,
  Rendered: 1,
  None: 2,
};

function VirtualView(props) {
  return props.children || null;
}

function createHiddenVirtualView() {
  return VirtualView;
}

module.exports = {
  __esModule: true,
  default: VirtualView,
  VirtualViewMode,
  VirtualViewRenderState,
  createHiddenVirtualView,
};
