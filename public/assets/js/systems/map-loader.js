AFRAME.registerSystem('map-loader', {

    /* COMPONENT PROPERTIES */

    schema: {
        csv: {
            type: 'string',
            required: true
        },
        header: { // whether or not the CSV contains a header row
            type: 'boolean',
            default: true
        },
        worker: {
            type: 'boolean', // whether or not to use web workers when parsing csv
            default: true
        },
        wallHeight: {
            type: 'number',
            default: 30
        },
        wallColor: {
            type: 'color',
            default: '#c9daf8'
        },
        roadColor: {
            type: 'color',
            default: '#666666'
        },
        pathColor: {
            type: 'color',
            default: '#d9d9d9'
        },
        districtsColor: {
            type: 'color',
            default: '#fef2cb'
        },
        tileWidth: {
            type: 'int',
            default: 10
        },
        tileDepth: {
            type: 'int',
            default: 10
        },
        x: { // X position of map tile containers
            type: 'number',
            default: 0
        },
        y: { // Y position of map tile containers
            type: 'number',
            default: 0
        },
        z: { // Z position of map tile containers
            type: 'number',
            default: 0
        }
    },  // System schema. Parses into `this.data`.

    /* INTERNAL PROPERTIES */

    maxTiles: 0,
    mapWidth: 0,
    mapDepth: 0,
    elGroups: {
        walls: null,
        other: null,
        roads: null,
        paths: null,
        districts: null
    },
    onSceneLoadedCallback: null,

    init: function () {
        this.onSceneLoadedCallback = this.onSceneLoaded.bind(this);
        this.el.addEventListener('loaded', this.onSceneLoadedCallback);
    },

    /* METHODS */

    loadMap: function() {
        const loader = new THREE.FileLoader();

        //TODO: replace loader with Google API to get CSV export from specific sheet
        loader.load(
            this.data.csv,
            this.onDataLoaded.bind(this),
            this.onDataProgress.bind(this),
            this.onDataError.bind(this)
        );
    },

    initElGroups: function () {
        for (const group in this.elGroups) {
            this.initElGroup(group, this.data[group + 'Color']);
        }
    },

    initElGroup: function (name, color) {
        const el = document.createElement('a-entity');
        el.setAttribute('material', color);
        el.setAttribute('id', name + '-group');

        console.log('TileW', this.data.tileWidth, 'TileH', this.data.tileDepth);

        el.addEventListener('child-attached', this.onChildAttached.bind(this));
        this.el.appendChild(el);
        this.elGroups[name] = el;

        console.log('Elgroups: ',this.elGroups)
    },

    initElFrom: function (group, x, y, z, type, width, height, depth, color) {
        const el = document.createElement('a-'+type);
        var geometry = {
            width: width,
            height: height
        };

        if (type === 'plane') {
            el.setAttribute('rotation', '-90 0 0');
        } else {
            geometry.depth = depth;
        }

        el.setAttribute('geometry', geometry);
        el.setAttribute('material', {
            color: color
        });
        const position = (x * this.data.tileWidth) + ' ' + y + ' ' + (z * this.data.tileDepth);
        //console.log('Position: ', position);
        el.setAttribute('position', position);
        console.log('Inserting type: ',group);
        this.elGroups[group].appendChild(el);
    },

    initGeometryFrom: function (chunkData) {
        var firstColPass = true;

        for (const x in chunkData) {
            if(chunkData.hasOwnProperty(x)) {
                for (const y in chunkData[x]) {
                    //console.log('x: ' + x + ' y:' + y);
                    //console.log(x,y)
                    // console.log(chunkData[x][y]);

                    if(chunkData[x].hasOwnProperty(y)) { // ignore first column
                        const tile = chunkData[x][y];

                        switch (tile.toUpperCase()) {
                            case 'W':
                                this.initElFrom('walls', x, this.data.wallHeight * 0.5, y, 'box', 10, this.data.wallHeight, 10, this.data.wallColor);
                                this.maxTiles++;
                                console.log('Tile: ', tile);
                                break;
                            case 'R':
                                this.initElFrom('roads', x, 0.1, y, 'plane', 10, 10, null, this.data.roadColor);
                                this.maxTiles++;;
                                console.log('Tile: ', tile);
                                break;
                            case 'P':
                                this.initElFrom('paths', x, 0.1, y, 'plane', 10, 10, null, this.data.pathColor);
                                this.maxTiles++;
                                console.log('Tile: ', tile);
                                break;
                            default:
                                if(parseInt(tile) > 0 && y !== '' && chunkData[x][y] !== '') {
                                    this.initElFrom('districts', x, 0.1, y, 'plane', 10, 10, null, this.data.districtsColor);
                                    this.maxTiles++;
                                    console.log('Tile: ', tile);
                                }
                                break;
                        }
                    }

                    if (firstColPass) {
                        this.mapDepth++
                    }
                }

                firstColPass = false;
            }
            this.mapWidth++;
        }
    },

    initGroupPositions: function () {

        console.log('Initializing group positions')

        console.log('Map width: ', this.mapWidth);
        console.log('Map height: ', this.mapDepth);

        const position = (this.data.x - (this.mapWidth * this.data.tileWidth * 0.5)) + ' ' + this.data.y + ' ' + (this.data.z - (this.mapDepth * this.data.tileDepth * 0.5));

        for (const g in this.elGroups) {
            console.log(this.elGroups[g]);
            if(this.elGroups.hasOwnProperty(g) && this.elGroups[g]) {
               this.elGroups[g].setAttribute('position', position);
                console.log('Group: ', this.elGroups[g].getAttribute('position'))
            }
        }

        console.log('Initialized group positions')
    },

    /* CALLBACK METHODS */

    onSceneLoaded: function () {
        this.el.removeEventListener('loaded', this.onSceneLoadedCallback);
        this.loadMap();
    },

    onDataLoaded: function (data) {
        console.log('Got data: ', data);

        this.initElGroups();

        const config = {
            header: this.data.header,
            worker: this.data.worker,
            complete: this.onParseComplete.bind(this),
            error: this.onParseError.bind(this),
            chunk: this.onParseChunk.bind(this)
        };

        Papa.parse(data, config)
    },

    onParseComplete: function () {
        console.log("Parsing complete");
        this.initGroupPositions();
    },

    onParseError: function (err) {
        console.log("Failed to parse csv: ", err);
    },

    onParseChunk: function (results) {
        console.log("Parsed chunk:", results);
        this.initGeometryFrom(results.data);
    },

    onDataProgress: function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },

    onDataError: function (err) {
        console.error('An error happened while loading map');
    },

    onChildAttached: function (e) {
        const totalChildren = (this.elGroups['walls'].children.length - 1) + (this.elGroups['roads'].children.length - 1);

        //console.log('Child attached: ' + totalChildren + ' / ' + (this.maxTiles - 1));

        if(totalChildren === this.maxTiles - 1) {
            //console.log('All tiles loaded');
            /* setTimeout(function(){
                this.elGroups['walls'].setAttribute('geometry-merger', 'preserveOriginal: false');
                this.elGroups['roads'].setAttribute('geometry-merger', 'preserveOriginal: false');
            }.bind(this),5000); */

        }
    }
});

