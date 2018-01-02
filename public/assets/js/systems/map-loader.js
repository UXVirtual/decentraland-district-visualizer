AFRAME.registerComponent('map-loader', {
    multiple: true,

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
            default: 5
        }
    },  // System schema. Parses into `this.data`.

    /* INTERNAL PROPERTIES */

    onSceneLoadedCallback: null,

    init: function () {

        /* COMPONENT INSTANCE PROPERTIES */

        this.maxTiles = 0;
        this.mapWidth = 0;
        this.mapDepth = 0;

        this.elGroups = {
            walls: null,
            other: null,
            roads: null,
            paths: null,
            districts: null
        };

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

    mergeAllGroupGeometry: function () {
        for (const group in this.elGroups) {
            if (this.elGroups.hasOwnProperty(group) && this.elGroups[group]) {
                setTimeout(function(){
                    console.log('Set group color: ',group + 'Color');

                    this.elGroups[group].setAttribute('geometry-merger', 'preserveOriginal: false');
                    console.log('Merged geometry for: ',group);
                    this.elGroups[group].setAttribute('material', {
                        color: this.data[group + 'Color'],
                        side: 'double'
                    });
                    /*this.elGroups[group].setAttribute('shadows', {
                        recieve: true,
                        cast: true
                    });*/
                }.bind(this),0);
            }
        }
    },

    getCurrentTotalChildren: function () {
        var total = 0;
        for (const group in this.elGroups) {
            if (this.elGroups.hasOwnProperty(group)) {
                total += this.elGroups[group].children.length;
            }
        }

        return total-1;
    },

    matchMiscTile: function (tileLabel, match) {
        const tileLabelSlice = tileLabel.slice(0,3);
        return (match) ? (tileLabelSlice === match) : ((tileLabelSlice === 'RAX') ||
            (tileLabelSlice === 'RAY') || (tileLabelSlice === 'RAZ'));
    },

    matchDistrictTile: function (tile, chunkData, x, y) {
        return (parseInt(tile) > 0 && y !== '' && chunkData[x][y] !== '');
    },

    getMaxTiles: function (chunkData) {
        var maxTiles = 0;

        for (const x in chunkData) {
            if(chunkData.hasOwnProperty(x)) {
                for (const y in chunkData[x]) {
                    if(chunkData[x].hasOwnProperty(y)) { // ignore first column
                        const tile = chunkData[x][y];
                        const tileLabel = tile.toUpperCase();

                        switch (tile.toUpperCase()) {
                            case 'W':
                            case 'R':
                            case 'P':
                                maxTiles++;
                                break;
                            default:
                                if(this.matchMiscTile(tileLabel.slice(0,3)) || this.matchDistrictTile(tile, chunkData, x, y)) {
                                    maxTiles++;
                                }
                                break;
                        }
                    }
                }
            }
        }

        return maxTiles;
    },

    initElGroups: function () {
        for (const group in this.elGroups) {
            this.initElGroup(group, this.data[group + 'Color']);
        }
    },

    initElGroup: function (name, color) {
        const el = document.createElement('a-entity');
        el.setAttribute('shadow', { receive: true });
        el.setAttribute('class', name + '-group');
        el.addEventListener('child-attached', this.onChildAttached.bind(this));
        this.el.appendChild(el);
        this.elGroups[name] = el;
    },

    initElFrom: function (group, x, y, z, rotX, rotY, rotZ, type, width, height, depth, color, className) {
        const el = document.createElement('a-'+type);
        var geometry = {
            width: width,
            height: height,
            buffer: false
        };

        el.setAttribute('material', {
            color: color,
            side: 'double'
        });

        if (type === 'plane') {
            el.setAttribute('rotation', rotX + ' ' + rotY + ' ' + rotZ);
        } else {
            geometry.depth = depth;
        }

        el.setAttribute('geometry', geometry);
        el.classList.add(className);

        const position = (x * this.data.tileWidth) + ' ' + y + ' ' + (z * this.data.tileDepth);
        el.setAttribute('position', position);
        this.elGroups[group].appendChild(el);
    },

    initGeometryFrom: function (chunkData) {
        var firstColPass = true;

        for (const x in chunkData) {
            if(chunkData.hasOwnProperty(x)) {
                for (const y in chunkData[x]) {
                    if(chunkData[x].hasOwnProperty(y)) { // ignore first column as it contains grid coords
                        const tile = chunkData[x][y];

                        const tileLabel = tile.toUpperCase();

                        switch (tile.toUpperCase()) {
                            case 'W':
                                this.initElFrom('walls', x, this.data.wallHeight * 0.5, y, 0, 0, 0, 'box', this.data.tileWidth, this.data.wallHeight, this.data.tileDepth, this.data.wallColor, 'wall');
                                break;
                            case 'R':
                                this.initElFrom('roads', x, 0.1, y, -90, 0, 0, 'plane', this.data.tileWidth, this.data.tileDepth, null, this.data.roadColor, 'road');
                                break;
                            case 'P':
                                this.initElFrom('paths', x, 0.1, y, -90, 0, 0, 'plane', this.data.tileWidth, this.data.tileDepth, null, this.data.pathColor, 'path');
                                break;
                            default:
                                const deg = tileLabel.slice(3);

                                // TODO: Offset ramps in Y direction by half so they line up with other planes
                                if(this.matchMiscTile(tileLabel, 'RAX')){
                                    this.initElFrom('paths', x, 0.1, y, deg, 0, 0, 'plane', this.data.tileWidth, this.data.tileDepth, null, this.data.roadColor, 'ramp');
                                }else if(this.matchMiscTile(tileLabel, 'RAY')){
                                    this.initElFrom('paths', x, 0.1, y, deg, -90, 0, 'plane', this.data.tileWidth, this.data.tileDepth, null, this.data.roadColor, 'ramp');
                                }else if(this.matchMiscTile(tileLabel, 'RAZ')){
                                    this.initElFrom('paths', x, 0.1, y, -90, 0, deg, 'plane', this.data.tileWidth, this.data.tileDepth, null, this.data.roadColor, 'ramp');
                                } else if(this.matchDistrictTile(tile, chunkData, x, y)) {
                                    this.initElFrom('districts', x, 0.1, y, -90, 0, 0, 'plane', this.data.tileWidth, this.data.tileDepth, null, this.data.districtsColor, 'district');
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
        this.maxTiles = this.getMaxTiles(results.data);
        this.initGeometryFrom(results.data);
    },

    onDataProgress: function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },

    onDataError: function (err) {
        console.error('An error happened while loading map');
    },

    onChildAttached: function (e) {
        const totalChildren = this.getCurrentTotalChildren();

        console.log('Child attached: ' + totalChildren + ' / ' + (this.maxTiles - 1));

        if(totalChildren === this.maxTiles - 1) {
            console.log('All tiles loaded');
            this.mergeAllGroupGeometry();
        }
    }
});

