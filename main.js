import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';



let scene, camera, renderer, pointerLockControls
let xdir = 0, zdir = 0
let time = Date.now()
let v = 5

const jumpVelocity = 0.1; // Вертикальная скорость прыжка
const gravity = 0.01; // Значение гравитации, влияющее на вертикальную скорость
let isJumping = false; // Флаг, указывающий, находится ли персонаж в процессе прыжка
let verticalVelocity = 1;

const canvas = document.getElementById('main-canvas')
let mainContainer = document.getElementById('main-container')
 

let elements = []

init()
animate()

function init() {
  // Создание сцены
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff)
  scene.fog = new THREE.Fog(0xffffff, 0, 500)
  scene.add(new THREE.GridHelper(1000, 1000))
  // Создание камеры
  camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
  camera.position.z = 1;
  camera.position.x = 1;
  camera.position.y = 1;


  // Создание рендерера
  renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio)
 
  pointerLockControls = new PointerLockControls(camera, canvas)

  if (dataJson) {
    if (dataJson.lights) {
      for (const light of dataJson.lights) {
        createLight(
          light.color,
          light.object.matrix[12],
          light.object.matrix[13],
          light.object.matrix[14],
          light.object.intensity,
          light.object.distance
        )
      }
    }

    if (dataJson.elements) {
      for (const element of dataJson.elements) {
        createElement(
          element.materials[0].color,
          element.object.matrix[12],
          element.object.matrix[13],
          element.object.matrix[14],
          element.geometries[0].radius,
          element.object.userData
        )
      }

    }
  }


  if (path_model) {

    const loader = new OBJLoader();
    loader.load(
      path_model,
      (object) => {

        scene.add(object)
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% загружено');
      },
      (error) => {
        console.error('Ошибка загрузки модели', error);
      }
    );
  }

  document.getElementById('button-start').onclick = () => {
    pointerLockControls.lock()
  }

 
  pointerLockControls.addEventListener('lock', function () {
    mainContainer.classList.add('fixed', 'inset-0', 'z-50')
    resizeWindow()
  })


  pointerLockControls.addEventListener('unlock', function () {
    mainContainer.classList.remove('fixed', 'inset-0', 'z-50')
    location.reload()
    resizeWindow()
  });

  move()
  
}
function createElement(color, x, y, z, radius, textData = null) {
  const elementGeometry = new THREE.SphereGeometry(radius, 32, 32);
  const elementMaterial = new THREE.MeshStandardMaterial({ color: color });
  const element = new THREE.Mesh(elementGeometry, elementMaterial);
  element.position.set(x, y, z);
  if (textData){
    element.userData = textData
  }
  scene.add(element);
  elements.push(element)
}

function createLight(color, x, y, z, intensity, distance) {
  const light = new THREE.PointLight(color, intensity, distance);
  light.position.set(x, y, z);
  scene.add(light);
}

function actionEvent(){
  const cameraCenter = new THREE.Vector3(0, 0, -1)
  camera.getWorldDirection(cameraCenter);
  const raycaster = new THREE.Raycaster(camera.position, cameraCenter);
  const intersects = raycaster.intersectObjects(elements);
  const messageContainer = document.getElementById('message-container');
  const messageData = document.getElementById('message-data')

  if (intersects.length > 0) {
    const userData = intersects[0].object.userData;
    if (userData && userData.message) {
      messageData.textContent = 'Сообщение: ' + userData.message;
      messageContainer.classList.remove('hidden');
    }
    if (userData && userData.url){
      const linkModel = document.getElementById('link-model')
      linkModel.classList.remove('hidden');
      linkModel.setAttribute('href', userData.url)

      document.addEventListener('keypress', event => {
        if (event.key === 'Enter'){
          window.location.href = linkModel.getAttribute('href');
        }
      })
    }
  } else {
    messageContainer.classList.add('hidden');
  }

  elements.forEach(element => {
    if (intersects.find(obj => obj.object === element)) {
      element.material.color.setHex(0xff0000);
    } else {
      element.material.color.setHex(0x00ff00); 
    }
  });
}

function move() {
  document.addEventListener('keydown', (event) => {
    switch (event.code) {
      case 'KeyW':
        zdir = -1
        break;
      case 'KeyS':
        zdir = 1
        break;
      case 'KeyA':
        xdir = -1
        break;
      case 'KeyD':
        xdir = 1
        break;
    }
  })

  document.addEventListener('keyup', (event) => {
    switch (event.code) {
      case 'KeyW':
        zdir = 0
        break;
      case 'KeyS':
        zdir = 0
        break;
      case 'KeyA':
        xdir = 0
        break;
      case 'KeyD':
        xdir = 0
        break;
    }
  })

  document.addEventListener('keydown', (event) => {
    if (event.code === 'Space' && !isJumping) {
      // Выполняется прыжок только если персонаж не находится в процессе прыжка
      isJumping = true;
      verticalVelocity = jumpVelocity;
    }
  });
}

function resizeWindow(){
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', resizeWindow);


function animate() {
  requestAnimationFrame(animate);
  if (pointerLockControls.isLocked) {
    const time1 = Date.now()
    const delta = (time - time1) / 1000

    let xd = xdir * v * delta
    let zd = zdir * v * delta

    pointerLockControls.moveForward(zd)
    pointerLockControls.moveRight(xd)
    time = time1

    if (isJumping) {
      verticalVelocity -= gravity
      camera.position.y += verticalVelocity
      if (camera.position.y <= 1) {
        isJumping = false
        camera.position.y = 1
        verticalVelocity = 0
      }
    }
  }

  actionEvent()
  renderer.render(scene, camera);
};


