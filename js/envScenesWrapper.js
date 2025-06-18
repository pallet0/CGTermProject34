import { createForestScene } from './scenes/forestScene.js';
import { createBeachScene } from './scenes/beachScene.js';
import { createOceanScene } from './scenes/oceanSceneModule.js';
import { createLabScene } from './scenes/labScene.js';

// 전역(window)으로 노출하여 기존 non-module 코드에서도 사용할 수 있게 합니다.
window.createForestScene = createForestScene;
window.createBeachScene  = createBeachScene;
window.createOceanScene  = createOceanScene; 
window.createLabScene = createLabScene;