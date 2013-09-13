xslicegui = function(targetRenderer, targetVolume, bbox){
  this.renderer = targetRenderer;
  this.renderer.interactor.xsliceguiref = this;
  this.volume = targetVolume;
  this.box = bbox;

  // more
  this.sceneOrientation = 0;
  this.coloring = true;
  this.color = [1, 1, 1];
  this.mode = 0;
  this.bbox = true;

  // animation 
  this.demoIntervalID = -1;

  // gui stuffs
  this.gui = null;
  // mode panel
  this.modegui = null;
  this.sliceMode = null;
  this.bboxMode = null;
  // slice panel
  this.slicegui = null;
  this.sliceXNXController = null;
  this.sliceXNYController = null;
  this.sliceXNZController = null;
  this.sliceXNCController
  // nav panel
  this.navgui = null;
  this.sliceXController = null;
  // scene panel
  this.scenegui = null;
  this.sceneOrientationController = null;
}

xslicegui.prototype.create = function(){
  // set colors and normals
  this.volume.xNormX = 1.0;
  this.volume.xNormY = 1.0;
  this.volume.xNormZ = 1.0;
  this.volume.xColor = this.color;

  //
  // The GUI panel
  //

  this.gui = new dat.GUI();
  this.setupmodegui();
  this.setupslicegui();
  this.setupnavgui();
  this.setupscenegui();

  // start to animate!
  var _this = this;
  this.demoIntervalID = setInterval(function(){
    _this.reslice();
    _this.volume.sliceInfoChanged(0);
    _this.sliceXController.__max = _this.volume.range[0] - 1;},5);
}

xslicegui.prototype.setupslicegui = function(){
  this.slicegui = this.gui.addFolder('Slice Orientation');
  this.sliceXNXController = this.slicegui.add(this.volume, 'xNormX', -1,1).name('Normal X Dir.').listen();
  this.sliceXNYController = this.slicegui.add(this.volume, 'xNormY', -1,1).name('Normal Y Dir.').listen();
  this.sliceXNZController = this.slicegui.add(this.volume, 'xNormZ', -1,1).name('Normal Z Dir.').listen();
  this.sliceXNCController = this.slicegui.addColor(this, 'color').name('Color').listen();
  this.slicegui.open();

  // callbacks
  var _this = this;

  normalChange = function(value){
    _this.color = [Math.abs(_this.volume.xNormZ), Math.abs(_this.volume.xNormY), Math.abs(_this.volume.xNormX)];
    if(_this.coloring){
      _this.volume.xColor = _this.color;
      _this.volume.maxColor = _this.volume.xColor;
    }
    _this.volume.sliceInfoChanged(0);
    _this.sliceXController.__max = _this.volume.range[0] - 1;
  }

  this.sliceXNXController.onChange(normalChange);
  this.sliceXNYController.onChange(normalChange);
  this.sliceXNZController.onChange(normalChange);

  this.sliceXNCController.onChange(function(value){
    if(_this.coloring){
      _this.volume.xColor = _this.color;
      _this.volume.maxColor = _this.volume.xColor;
      _this.volume.sliceInfoChanged(0);
    }
  });
}

xslicegui.prototype.setupnavgui = function(){
  this.navgui = this.gui.addFolder('Slice Selection');
  this.sliceXController = this.navgui.add(this.volume, 'indexX', 0,this.volume.range[0] - 1).name('Slice Index').listen();
  this.navgui.open();

  var _this = this;
  this.sliceXController.onChange(function(value){
    // Hide Y and Z slices
    _this.volume.children[1]['visible'] = false;
    _this.volume.children[2]['visible'] = false;
  });
}

xslicegui.prototype.setupscenegui = function(){
  // UI
  this.scenegui = this.gui.addFolder('Scene Orientation');
  this.sceneOrientationController = this.scenegui.add(this, 'sceneOrientation', { 'Free':0, 'Sagittal':1, 'Coronal':2, 'Axial':3 } ).name('View');
  this.scenegui.open();

  // callbacks
  this.renderer.interactor.addEventListener(X.event.events.ROTATE, this.updateSceneView);

  var _this = this;
  this.sceneOrientationController.onChange(function(value){
    if(value == 1){
      // move camera
      _this.renderer.camera.position = [-400, 0, 0];
      _this.renderer.camera.up = [0, 0, 1];

      // update normals
      _this.volume.xNormX = 1; 
      _this.volume.xNormY = 0; 
      _this.volume.xNormZ = 0; 

    }
    else if(value == 2){
      // move camera
      _this.renderer.camera.position = [0, 400, 0];
      _this.renderer.camera.up = [0, 0, 1];

      // update normals
      _this.volume.xNormX = 0; 
      _this.volume.xNormY = 1; 
      _this.volume.xNormZ = 0; 
    }
    else if(value == 3){
      // move camera
      _this.renderer.camera.position = [0, 0, -400];
      _this.renderer.camera.up = [0, 1, 0];

      // update normals
      _this.volume.xNormX = 0; 
      _this.volume.xNormY = 0; 
      _this.volume.xNormZ = 1; 
    }

    // update color
    _this.color = [Math.abs(_this.volume.xNormZ), Math.abs(_this.volume.xNormY), Math.abs(_this.volume.xNormX)];
    if(_this.coloring){
      _this.volume.xColor = [Math.abs(_this.volume.xNormZ), Math.abs(_this.volume.xNormY), Math.abs(_this.volume.xNormX)];
      _this.volume.maxColor = [Math.abs(_this.volume.xNormZ), Math.abs(_this.volume.xNormY), Math.abs(_this.volume.xNormX)];
    }

    // update slice and gui
    _this.volume.sliceInfoChanged(0);
    _this.sliceXController.__max = _this.volume.range[0] - 1;
  });
}

xslicegui.prototype.updateSceneView = function(){
  var _this = this;
  if (typeof this.xsliceguiref != 'undefined'){
    _this = this.xsliceguiref
  }

  // get mode
  if(_this.sliceMode.getValue() == 1){
    var _x = _this.renderer.camera.view[2];
    var _y = _this.renderer.camera.view[6];
    var _z = _this.renderer.camera.view[10];
    // normalize 
    var length = Math.sqrt(_x*_x + _y*_y+_z*_z);

    _this.volume.xNormX = _x/length;
    _this.volume.xNormY = _y/length;
    _this.volume.xNormZ = _z/length;
    _this.renderer.color = [Math.abs(_this.volume.xNormZ), Math.abs(_this.volume.xNormY), Math.abs(_this.volume.xNormX)];

    if(_this.coloring){
      _this.volume.xColor = [Math.abs(_this.volume.xNormZ), Math.abs(_this.volume.xNormY), Math.abs(_this.volume.xNormX)];
      _this.volume.maxColor = [Math.abs(_this.volume.xNormZ), Math.abs(_this.volume.xNormY), Math.abs(_this.volume.xNormX)];
    }
    _this.volume.sliceInfoChanged(0);
    _this.sliceXController.__max = _this.volume.range[0] - 1;
  }

  // update navigation controller
  if(_this.sceneOrientationController.getValue() != 0){
    _this.sceneOrientationController.setValue(0);
   }
}

xslicegui.prototype.setupmodegui = function(){
  // UI
  this.modegui = this.gui.addFolder('General');
  this.sliceMode = this.modegui.add(this, 'mode', { 'Demo':0, 'Rotate Cam':1, 'Rotate Box':2 } ).name('Interaction Mode');
  this.bboxMode = this.modegui.add(this, 'bbox').name('Show BBox');
  this.coloringMode = this.modegui.add(this, 'coloring').name('Slice Coloring');
  this.modegui.open();

  // callbacks
  var _this = this;
  this.sliceMode.onChange(function(value) {
    if (value == 0) {
      // setup demo
      var _this2 = _this;
      _this.demoIntervalID = setInterval(function(){
        _this2.reslice();
        _this2.volume.sliceInfoChanged(0);
        _this2.sliceXController.__max = _this2.volume.range[0] - 1;},5); 
    }
    else if (value == 1){
      // cleanup demo
      clearInterval(_this.demoIntervalID);

      _this.updateSceneView();
    }
    else if (value == 2){
      // cleanup demo
      clearInterval(_this.demoIntervalID);
    }
  });
  
  this.bboxMode.onChange(function(value) {
    _this.box.visible = value;
  });

  this.coloringMode.onChange(function(value) {
    if(value){
      _this.volume.xColor = _this.color;
      _this.volume.maxColor = _this.volume.xColor;
    }
    else{
      _this.volume.xColor = [1, 1, 1];
      _this.volume.maxColor = [1, 1, 1];
    }
    _this.volume.sliceInfoChanged(0);
  });
}

xslicegui.prototype.reslice = function(){
  var time = new Date().getTime() * 0.001;
  this.volume.xNormX = Math.cos(time);
  this.volume.xNormY = Math.cos(time*1.2);
  this.volume.xNormZ = Math.cos(time*1.5);
  this.color = [Math.abs(this.volume.xNormZ), Math.abs(this.volume.xNormY), Math.abs(this.volume.xNormX)];
  if(this.coloring){
    this.volume.xColor = [Math.abs(this.volume.xNormZ), Math.abs(this.volume.xNormY), Math.abs(this.volume.xNormX)];
    this.volume.maxColor = [Math.abs(this.volume.xNormZ), Math.abs(this.volume.xNormY), Math.abs(this.volume.xNormX)];
  }
}

window.onload = function() {

  // create and initialize a 3D renderer
  var r = new X.renderer3D();
  r.bgColor = [.1, .1, .1];
  r.init();
  
  // create a X.volume
  volume = new X.volume();
  // .. and attach a volume
  volume.file = 'http://x.babymri.org/?lesson17.nii.gz';

  // only add the volume for now, the mesh gets loaded on request
  r.add(volume);

  // the onShowtime method gets executed after all files were fully loaded and
  // just before the first rendering attempt
  r.onShowtime = function() {

    var loadingDiv = document.getElementById('loading');
    loadingDiv.style.display = 'none';

     // Hide Y and Z slices
    volume.children[1]['visible'] = false;
    volume.children[2]['visible'] = false;
    
    // CREATE Bounding Box
    var res = [volume.bbox[0],volume.bbox[2],volume.bbox[4]];
    var res2 = [volume.bbox[1],volume.bbox[3],volume.bbox[5]];

    box = new X.object();
    box.points = new X.triplets(72);
    box.normals = new X.triplets(72);
    box.type = 'LINES';
    box.points.add(res2[0], res[1], res2[2]);
    box.points.add(res[0], res[1], res2[2]);
    box.points.add(res2[0], res2[1], res2[2]);
    box.points.add(res[0], res2[1], res2[2]);
    box.points.add(res2[0], res[1], res[2]);
    box.points.add(res[0], res[1], res[2]);
    box.points.add(res2[0], res2[1], res[2]);
    box.points.add(res[0], res2[1], res[2]);
    box.points.add(res2[0], res[1], res2[2]);
    box.points.add(res2[0], res[1], res[2]);
    box.points.add(res[0], res[1], res2[2]);
    box.points.add(res[0], res[1], res[2]);
    box.points.add(res2[0], res2[1], res2[2]);
    box.points.add(res2[0], res2[1], res[2]);
    box.points.add(res[0], res2[1], res2[2]);
    box.points.add(res[0], res2[1], res[2]);
    box.points.add(res2[0], res2[1], res2[2]);
    box.points.add(res2[0], res[1], res2[2]);
    box.points.add(res[0], res2[1], res2[2]);
    box.points.add(res[0], res[1], res2[2]);
    box.points.add(res[0], res2[1], res[2]);
    box.points.add(res[0], res[1], res[2]);
    box.points.add(res2[0], res2[1], res[2]);
    box.points.add(res2[0], res[1], res[2]);
    for ( var i = 0; i < 24; ++i) {
      box.normals.add(0, 0, 0);
    }
    r.add(box);

    var center = [volume.bbox[0] + (volume.bbox[1]-volume.bbox[0]),
              volume.bbox[2] + (volume.bbox[3]-volume.bbox[2]),
              volume.bbox[4] + (volume.bbox[5]-volume.bbox[4])
              ]

    // time to create the GUI!
    gui = new xslicegui(r, volume, box);
    gui.create();
  };
  
  // adjust the camera position a little bit, just for visualization purposes
  r.camera.position = [270, 250, 330];
  
  r.render();
};