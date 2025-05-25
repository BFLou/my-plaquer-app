module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "prettier"
  ],
  plugins: ["react"],
  rules: {
    "react/react-in-jsx-scope": "off"
  },
  settings: {
    react: {
      version: "detect"
    }
  }
};
