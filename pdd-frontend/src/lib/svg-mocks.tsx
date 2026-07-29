import React from "react";

// Web-compliant SVG mocks translating native SVG to standard HTML5 tags
export const Svg = ({ children, ...props }: any) => <svg {...props}>{children}</svg>;
export const Path = (props: any) => <path {...props} />;
export const Line = (props: any) => <line {...props} />;
export const Circle = (props: any) => <circle {...props} />;
export const Rect = (props: any) => <rect {...props} />;
export const G = ({ children, ...props }: any) => <g {...props}>{children}</g>;
export const Text = ({ children, ...props }: any) => <text {...props}>{children}</text>;
export const Defs = ({ children, ...props }: any) => <defs {...props}>{children}</defs>;
export const Stop = (props: any) => <stop {...props} />;
export const LinearGradient = ({ children, ...props }: any) => <linearGradient {...props}>{children}</linearGradient>;

export default Svg;
