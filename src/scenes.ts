export interface SceneData {
  image: string;
  narrative: string;
  leftChoice: string;
  rightChoice: string;
}

const SCENES: SceneData[] = [
  {
    image: '/images/scene-01.jpg',
    narrative: 'A dust-choked crossroads. The left fork climbs toward the mountains. The right trails smoke from a distant chimney.',
    leftChoice: 'Take the mountain pass',
    rightChoice: 'Follow the smoke',
  },
  {
    image: '/images/scene-02.jpg',
    narrative: 'The trail narrows. Claw marks line the trees. Something watches from the canopy above.',
    leftChoice: 'Press forward quietly',
    rightChoice: 'Light a torch',
  },
  {
    image: '/images/scene-03.jpg',
    narrative: 'An old bridge sways over the gorge. A figure on the other side raises a hand — greeting or warning.',
    leftChoice: 'Cross the bridge',
    rightChoice: 'Find another way',
  },
  {
    image: '/images/scene-04.jpg',
    narrative: 'Rain hammers the canopy. A cave mouth offers shelter, but smoke curls from deep within.',
    leftChoice: 'Enter the cave',
    rightChoice: 'Push through the storm',
  },
  {
    image: '/images/scene-05.jpg',
    narrative: 'A creature covered in bioluminescent spikes blocks the path. It hums a low, resonant tone.',
    leftChoice: 'Approach slowly',
    rightChoice: 'Back away',
  },
  {
    image: '/images/scene-06.jpg',
    narrative: 'The android stares with dead eyes. Its chest panel blinks: AWAITING INSTRUCTION.',
    leftChoice: 'Give it orders',
    rightChoice: 'Walk past',
  },
];

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

const shuffled = shuffle([...SCENES]);
let sceneIndex = 0;

export function getCurrentScene(): SceneData {
  return shuffled[sceneIndex % shuffled.length];
}

export function advanceScene(): SceneData {
  sceneIndex++;
  return getCurrentScene();
}

export function getNextScene(): SceneData {
  return shuffled[(sceneIndex + 1) % shuffled.length];
}

export function preloadImage(src: string): void {
  const img = new Image();
  img.src = src;
}
