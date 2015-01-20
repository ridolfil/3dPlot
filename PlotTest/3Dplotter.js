
(function ($) {

    $.fn.ThreeDiPlot = function(options){

        //Graph canvas
        var gr = this;
        var graphMesh, wireMaterial, textMesh;
        wireMaterial = new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors, side: THREE.DoubleSide, wireframe: true, transparent: false });

        //Options
        var optDefault = {
            bgColor: 0x888888
        };

        var opt = $.extend(optDefault, options);

        //Create a THREE Scene
        var scene = new THREE.Scene();
        scene.lookAt(0, 1, 0);

        //Camera Setup
        var SCREEN_WIDTH = gr.innerWidth(),
            SCREEN_HEIGHT = gr.innerHeight();
        var VIEW_ANGLE = 30,
            ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT,
            NEAR = 0.1, FAR = 20000;

        camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);

        camera.position.set(10, 4, 7);

        scene.add(camera);

        //THREE Renderer
        //if (Detector.webgl)
        var renderer = new THREE.WebGLRenderer({ antialias: true });
        //else
        //    renderer = new THREE.CanvasRenderer();

        
        renderer.setClearColor(opt.bgColor, 1); // Set the background color

        renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
        gr.append(renderer.domElement);


        //Control
        var controls = new THREE.OrbitControls(camera, renderer.domElement);


        //Set and create the grids
        var gridXY = new THREE.GridHelper(2.5, 0.5);
        gridXY.position.set(2.5, 0, 0);
        gridXY.rotation.x = Math.PI / 2;
        gridXY.setColors(new THREE.Color(0x000066), new THREE.Color(0xeeeeee));
        scene.add(gridXY);

        var gridYZ = new THREE.GridHelper(2.5, 0.5);
        gridYZ.position.set(0, 0, 2.5);
        gridYZ.rotation.z = Math.PI / 2;
        gridYZ.setColors(new THREE.Color(0x660000), new THREE.Color(0xeeeeee));
        scene.add(gridYZ);


        //Add the axis
        scene.add(new THREE.AxisHelper(5));



        createGraph();

        addLabel(1.1, new THREE.Vector3(5, 1, 0));

        render();

     
        function addLabel(string, position) {
           
            var textGeom = new THREE.TextGeometry(string,
            {
                size: 0.17, height: 0.008, curveSegments: 3,
                font: "droid sans", weight: "normal", style: "normal"
                //bevelThickness: 1, bevelSize: 2, bevelEnabled: true,
                //material: 0, extrudeMaterial: 1
            });
            // font: helvetiker, gentilis, droid sans, droid serif, optimer
            // weight: normal, bold

            var textMaterial = new THREE.MeshBasicMaterial({ color: 0x000088 });
            textMesh = new THREE.Mesh(textGeom, textMaterial);


            textMesh.position.set(5,1,0);
            textMesh.lookAt(camera.position)
            scene.add(textMesh);
        }


        //Add all the label numbers on the grid
        function addNumbers() { };


        //Render function
        function render() {
            requestAnimationFrame(render);
           
            moveCamera();
            //cube.rotation.x += 0.1;
            textMesh.lookAt(camera.position)
            controls.update();
            renderer.render(scene, camera);
        };

        function moveCamera() {
            var x = camera.position.getComponent(0);
            var y = camera.position.getComponent(1);
            var z = camera.position.getComponent(2);
            var l = Math.sqrt(x*x + y*y);
            var ang = Math.atan(y / x) + 0.001;

            camera.position.set(l * Math.cos(ang), l * Math.sin(ang),z)
        }
        function createGraph() {


            var segments = 40;
            var xRange = 5;
            var yRange = 5;
            var meshFunction = function (x, y) {
                x = xRange * x - 2.5;
                y = yRange * y - 2.5;
                var z = 0.5 * Math.sin(Math.sqrt(20 * x * x + 20 * y * y));//= Math.cos(x) * Math.sqrt(y);
                if (isNaN(z))
                    return new THREE.Vector3(0, 0, 0); // TODO: better fix
                else
                    return new THREE.Vector3(x + 2.5, z, y + 2.5);
            };

            // true => sensible image tile repeat...
            graphGeometry = new THREE.ParametricGeometry(meshFunction, segments, segments, true);

            ///////////////////////////////////////////////
            // calculate vertex colors based on Z values //
            ///////////////////////////////////////////////
            graphGeometry.computeBoundingBox();
            var zMin = graphGeometry.boundingBox.min.y;
            var zMax = graphGeometry.boundingBox.max.y;
            zRange = zMax - zMin;
            var color, point, face, numberOfSides, vertexIndex;
            // faces are indexed using characters
            var faceIndices = ['a', 'b', 'c', 'd'];
            // first, assign colors to vertices as desired
            for (var i = 0; i < graphGeometry.vertices.length; i++) {
                point = graphGeometry.vertices[i];
                color = new THREE.Color(0x0000ff);
                color.setHSL(0.575, 0.62, 0.9 - 0.7 * (zMax - point.y) / zRange);
                graphGeometry.colors[i] = color; // use this array for convenience
            }
            // copy the colors as necessary to the face's vertexColors array.
            for (var i = 0; i < graphGeometry.faces.length; i++) {
                face = graphGeometry.faces[i];
                numberOfSides = (face instanceof THREE.Face3) ? 3 : 4;
                for (var j = 0; j < numberOfSides; j++) {
                    vertexIndex = face[faceIndices[j]];
                    face.vertexColors[j] = graphGeometry.colors[vertexIndex];
                }
            }
            ///////////////////////
            // end vertex colors //
            ///////////////////////

            // material choices: vertexColorMaterial, wireMaterial , normMaterial , shadeMaterial


            if (graphMesh) {
                scene.remove(graphMesh);
                // renderer.deallocateObject( graphMesh );
            }

            //wireMaterial.map.repeat.set(segments, segments);

            graphMesh = new THREE.Mesh(graphGeometry, wireMaterial);
            graphMesh.doubleSided = true;
            scene.add(graphMesh);
        }
    };

}(jQuery));