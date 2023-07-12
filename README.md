# Xrpdf

## Installation Instructions

The repo has a submodule [react-pdf-highlighter](https://github.com/surgeaccess/react-pdf-highlighter) so, we need the following commands
`$ git clone --recurse-submodules https://github.com/surgeaccess/xrpdf.git`  
Then in project root run  
`$ yarn install`  
capacitor and therefore (android studio and relevant libraries are needed)

## Updation Instructions

1. Go to project root directory
2. Run `git pull`
3. go to `src/custom-libs/react-pdf-highlighter`
4. Run `git pull`

## Running Instructions

In project root run `$ yarn start`

## for production release

`$ yarn build`

### building an apk (for android)

-   `$ yarn build`
-   `$ npx cap sync`
-   `$ npx cap open android`  
     opens android studio, will need to build apk from there
