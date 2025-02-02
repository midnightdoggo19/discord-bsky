const fs = require('fs');
const path = require('path');
<<<<<<< HEAD
=======
const validateNpmPackage = require('validate-npm-package-name');
>>>>>>> 6890512a7873675156d5955965b682b056e12ae8

const packageJsonPath = path.resolve(__dirname, '../package.json');
let packageJson;

// Load the package.json file
beforeAll(() => {
    const fileContent = fs.readFileSync(packageJsonPath, 'utf8');
    packageJson = JSON.parse(fileContent);
});

<<<<<<< HEAD
describe('dependencies tests', () => {
=======
describe('package.json tests', () => {
    test('should have a valid structure', () => {
        expect(packageJson).toHaveProperty('main');
        expect(packageJson).toHaveProperty('scripts');
        expect(packageJson).toHaveProperty('dependencies');
        expect(packageJson).toHaveProperty('devDependencies');
    });

    test('should have a start script', () => {
        expect(packageJson.scripts).toHaveProperty('start');
    });

>>>>>>> 6890512a7873675156d5955965b682b056e12ae8
    test('dependencies should not include duplicates in devDependencies', () => {
        const deps = Object.keys(packageJson.dependencies || {});
        const devDeps = Object.keys(packageJson.devDependencies || {});
        const duplicates = deps.filter(dep => devDeps.includes(dep));
        expect(duplicates).toEqual([]);
    });

    test('dependencies and devDependencies should have valid versions', () => {
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
        const versionRegex = /^[^ ]+$/; // Simple regex to check for valid version formats
        Object.values(dependencies).forEach(version => {
            expect(version).toMatch(versionRegex);
        });
    });
});
