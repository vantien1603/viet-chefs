module.exports = function (api) {
    api.cache(true);
    return {
      presets: ['babel-preset-expo'],
    };
  };
  

// module.exports = {
//   presets: ['module:metro-react-native-babel-preset'], // Add this preset
//   plugins: [
//     [
//       'module:react-native-dotenv',
//       {
//         envName: 'viet-chef',
//         moduleName: '@env',
//         path: '.env',
//         blocklist: null,
//         allowlist: null,
//         blacklist: null, // DEPRECATED
//         whitelist: null, // DEPRECATED
//         safe: false,
//         allowUndefined: true,
//         verbose: false,
//       },
//     ],
//   ],
// };