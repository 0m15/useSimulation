# Viz prototypes/ideas

## Components

Dataviz is modularized into following components:

- <Graph/> to handle the data
- <Simulation/> to enhance data with simulation forces
- <Renderer> to render the nodes to screen

## Avilable renderers (so far)

1. DOM renderer
2. Webgl (based on react-three-fiber) renderer

To switch renderer, open `App.js` and use

    <Graph type="webgl">

or

    <Graph type="dom">

## Development

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.


## TODO

- Create custom hooks to use the modules with ease