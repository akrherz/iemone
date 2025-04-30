export default [
    {
        files: ["src/*.js"],
        languageOptions: {
            globals: {
                "$": false,
                "jQuery": false,
                "ol": false,
                "iemdata": false,
                "moment": false,
                "google": false
            }
        }
    }
];
