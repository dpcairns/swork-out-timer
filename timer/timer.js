/* a lot of my refactoring here is kind of a guess, but it's a gesture toward creating a file that's a bit easier to maintain. I say that because I found this file pretty challenging to read, so I can't guarantee that my refactor doesn't break other features. One of the effects of clean coade is the sense that you can safely refactor without worriyng about other features, and this file, for all its impressive work, would be really challenging for a coder to maintain. Breaking this work down into smaller functions with clear names could do some work toward making this file more approachable.
*/
import { checkAuth, getOneRoutineAndExercises, logout } from '../fetch-utils.js';

checkAuth();
const routineNameEl = document.querySelector('#routine-name');
const logoutButton = document.getElementById('logout');
const currentExerciseEl = document.querySelector('#current-exercise');
// const iconEl = document.querySelector('#icon');
const timerEl = document.querySelector('#timer');
const startButton = document.querySelector('#start-button');
const pauseButton = document.querySelector('#pause-button');
const endButton = document.querySelector('#end-button');
const buttonContainer = document.querySelector('#button-container');
const audioPlayer = document.querySelector('#audio-player');
const restDropdown = document.querySelector('#rest-dropdown');

const params = new URLSearchParams(window.location.search);
const routineId = params.get('id');

let routines = [];
let exercises = [];
let justDurations = [];
let justNames = [];

let i = 0;

let exerciseTimer = '';
let waitTimer = '';
// eslint-disable-next-line no-unused-vars
let restTimeout = '';
let restTimer = '';

let restTime = 3;
let isRest = false;


logoutButton.addEventListener('click', () => {
    logout();
});

restDropdown.addEventListener('change', ()=>{
    restTime = restDropdown.value;
});

window.addEventListener('load', async() =>{
    //fetch routines and exercises joined from supabase
    routines = await getOneRoutineAndExercises(routineId);

    //make new array for the nested exercises
    exercises = routines[0].routines.exercises;

    //map a new array for just the durations
    justDurations = exercises.map((exercise)=>{
        return exercise.duration;
    });

        // map a new array for just the exercise names
    justNames = exercises.map((exercise)=>{
        return exercise.name;
    });

    // Display routine name
    routineNameEl.textContent = routines[0].routines.name;

    // Display first exercise
    currentExerciseEl.textContent = `First Up: ${exercises[0].name}`;

    //Hide the pause button
    pauseButton.style.display = 'none';


   
});

startButton.addEventListener('click', async()=>{

    //call inverval timer + timeout function with durations and names
    intervalAndTimeout(justDurations, justNames);

    //when clicking start hide the button (pause button generated)
    startButton.style.display = 'none';

    // show the pause button
    pauseButton.style.display = 'block';

    //disable dropdown
    restDropdown.disabled = 'true';
});

pauseButton.addEventListener('click', () =>{
   
    if (exerciseTimer) {
        clearInterval(exerciseTimer);
    }
    if (waitTimer) {
        clearTimeout(waitTimer);
    }

    if (restTimer) {
        clearInterval(restTimer);
    }
    if (restTimeout) {
        clearTimeout(restTimeout);
    }
    
    startButton.style.display = 'block';
    startButton.textContent = `Resume`;
    pauseButton.style.display = 'none';

    console.log('PAUSED');
});


endButton.addEventListener('click', () =>{
   
    if (exerciseTimer) {
        clearInterval(exerciseTimer);
    }
    if (waitTimer) {
        clearTimeout(waitTimer);
    }

    window.location.href = `../routine-detail/?id=${routineId}`;
    
});

function displayRestTime() {
    if (restTime < 10) {
        timerEl.textContent = `00:0${ restTime }`;
    }
    else if (restTime >= 10){
        timerEl.textContent = `00:${ restTime }`;
    }
}

function whenArrayIsDone(durationsArray, namesArray) {
    displayRestTime();
                    // displays Rest
    currentExerciseEl.textContent = 'Rest';
        
                    // run rest timer
    restTimer = setInterval(decrementAndDisplayRest, 1000);
        
                    // sets rest Timeout then executes next exercise timer
    restTimeout = setTimeout(()=> {
                        //lowers rest flag as next thing executing is exercise timer
        isRest = false;
                        //increments index
        i++;               
                        //RECURSION HERE
        intervalAndTimeout(durationsArray, namesArray, i);
    }, restTime * 1000 + 1000);
    
}

function renderDurations(durationsArray) {
    if (durationsArray[i] < 10) {
        timerEl.textContent = `00:0${ durationsArray[i] }`;
    }
    else if (durationsArray[i] >= 10){
        timerEl.textContent = `00:${ durationsArray[i] }`;
    }
}

function decrementAndDisplayExercise(durationsArray, i){
    //check if duration > 0
    if (durationsArray[i] > 0){
        //decrement duration
        durationsArray[i]--;

        //display remaining duration
        renderDurations(durationsArray);
        console.log(durationsArray);
    }

    // add ticks to 1,2,3 seconds
    if (durationsArray[i] <= 3 && durationsArray[i] >= 1) {
        audioPlayer.src = `../assets/tick.wav`;
    }

    else if (durationsArray[i] <= 0) {
        // add buzzer at 0
        audioPlayer.src = `../assets/short-buzzer.m4a`;

        // clear interval
        clearInterval(exerciseTimer);
    }
}

function decrementAndDisplayRest() {
    //checks if duration >0
    if (restTime > 0){
        //decrements rest time
        restTime--;

        //displays remaining rest time
        displayRestTime();
        console.log('rest time:', restTime);
    }

    // adds ticks
    if (restTime <= 3 && restTime >= 1) {
        audioPlayer.src = `../assets/tick.wav`;
    }

    else if (restTime <= 0) {
        // adds buzzer
        audioPlayer.src = `../assets/short-buzzer.m4a`;
        // clears interval
        clearInterval(restTimer);

        //resets the rest time - VERY IMPORTANT FOR RECURSION
        restTime = restDropdown.value;
    }

}

function intervalAndTimeout(durationsArray, namesArray){
    if (!isRest) {
        buttonContainer.textContent = '';
        renderDurations(durationsArray);
        currentExerciseEl.textContent = namesArray[i];
        exerciseTimer = setInterval(decrementAndDisplayExercise, 1000, durationsArray, i);
    
        // log index
        console.log('i=', i);
        
        // sets timeout for current duration, then increments[i], then reruns function recursively

        const durationPlusOneSecond = durationsArray[i] * 1000 + 1000;

        const beginRestAndMoveOn = () => {
            // raises rest flag as next thing is a rest timer
            isRest = true;

            // checks if we are at the end of the array, and if we are doesnt run
            if (i !== (justDurations.length - 1)) {
                whenArrayIsDone(durationsArray, namesArray);
            } 
            //if we are at the end of the array, complete the workout
            else if (i === (justDurations.length - 1)) {
                console.log('workout complete');
                currentExerciseEl.textContent = 'WORKOUT COMPLETE!';
                timerEl.textContent = `NICE!`;
                pauseButton.style.display = 'none';
            }
            
    
        };

        waitTimer = setTimeout(beginRestAndMoveOn, durationPlusOneSecond);
    }
    // this conditionally is for if we pause in a rest and resume, we skip the exercise timer and just run the rest timer
    else {
        // checks if we are at the end of the array, and if we are doesnt run
        if (i !== (justDurations.length - 1)) {
            whenArrayIsDone(durationsArray, namesArray);
        }
    }
}