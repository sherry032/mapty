'use strict';



const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
    date = new Date();
    id = (Date.now() + "").slice(-10)
    constructor(coords, distance, duration){
      this.coords = coords
      this.distance = distance
      this.duration = duration
    }
    _setDescription(){
     // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase() + this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`
    }
}

class Running extends Workout {
    type = "running";
    constructor(coords, distance, duration, cadence){
      super(coords, distance, duration)
      this.cadence = cadence
      this.calcPace()
      this._setDescription()
    }
    calcPace(){
        this.pace = this.duration / this.distance
        return this.pace
    }
}

class Cycling extends Workout {
    type = "cycling";
    constructor(coords, distance, duration, elevation){
      super(coords, distance, duration)
      this.elevation = elevation
      this.calcSpeed()
      this._setDescription()
    }
    calcSpeed(){
        this.speed = this.distance / (this.duration / 60)
        return this.speed
    }
}

class App{
    #map;
    #mapEvent;
    #workouts = [];
    #mapZoomLevel = 13;
    constructor(){
        this._getPosition()
        this._getLocalStorage()
        inputType.addEventListener("change", this._toggleElevationField)
        form.addEventListener("submit", this._newWorkout.bind(this))
        containerWorkouts.addEventListener('click', this._moveMapTo.bind(this))
    }

    _getPosition(){navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function(){
        alert(`can't get your location`)
    })}

    _loadMap(position){
    const { latitude , longitude } = position.coords
    const coords = [latitude, longitude]

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.#map);
    this.#map.on("click", this._showForm.bind(this))
    this.#workouts.forEach(work => {
        this._renderWorkoutMarker(work)
    })
    }

    _showForm(mapE){
            this.#mapEvent = mapE
          form.classList.remove("hidden")
          inputDistance.focus()
    }
    _hideForm(){
        inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value = "";
        form.style.display = "none"
        form.classList.add("hidden")
        setTimeout(()=>form.style.display = "grid", 1000)
    }
    _toggleElevationField(){
        inputCadence.closest(".form__row").classList.toggle("form__row--hidden")
        inputElevation.closest(".form__row").classList.toggle("form__row--hidden")
    }
    _newWorkout(e) {
        e.preventDefault()
        const { lat, lng } = this.#mapEvent.latlng
        const type = inputType.value
        const distance = +inputDistance.value
        const duration = +inputDuration.value

        const validInputs = (...inputs) =>
        inputs.every(inp => Number.isFinite(inp));
      const allPositive = (...inputs) => inputs.every(inp => inp > 0);
        let workout;

        if(type === "running"){
            const cadence = +inputCadence.value
            if(!validInputs(distance, duration, cadence) ||
            !allPositive(distance, duration, cadence)
          )
            return alert('Inputs have to be positive numbers!');

            workout = new Running([lat, lng], distance, duration, cadence)
        }
        // If workout cycling, create cycling object

        if(type === "cycling"){
            const elevation = +inputElevation.value;
            if (
                !validInputs(distance, duration, elevation) ||
                !allPositive(distance, duration)
              )
            return alert(`Not a valid input`)
            workout = new Cycling([lat, lng], distance, duration, elevation)
        }
        

        this.#workouts.push(workout)
        this._renderWorkoutMarker(workout)
        this._renderWorkout(workout)
        this._hideForm()
        this._setLocalStorage()
    }
    _renderWorkoutMarker(workout){
        L.marker(workout.coords).addTo(this.#map)
        .bindPopup(L.popup({
          maxWidth: 300,
          minWidth: 50,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
        .setContent('<p>Hello world!<br />This is a nice popup.</p>'))
        .openPopup();
    }
    _renderWorkout(workout){
        let html = `<li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"}</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>`
        if(workout.type === "running"){
            html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`
        }
        if(workout.type === "cycling"){
            html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevation}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>`
        }
        form.insertAdjacentHTML("afterend", html)

    }

    _moveMapTo(e){
            if (!this.#map) return;
    
        const workoutEl = e.target.closest('.workout');

        if (!workoutEl) return;
    
        const workout = this.#workouts.find(
          work => work.id === workoutEl.dataset.id
        );

        this.#map.setView(workout.coords, this.#mapZoomLevel, {
          animate: true,
          pan: {
            duration: 1,
          },
        })
    }
    _setLocalStorage(){
    localStorage.setItem("workouts",  JSON.stringify(this.#workouts))
    }

    _getLocalStorage(){
    const data = JSON.parse(localStorage.getItem("workouts"))
    if(!data) return;
    this.#workouts = data
    this.#workouts.forEach(work => {
        this._renderWorkout(work)
    })
    }

    reset() {
        localStorage.removeItem('workouts');
        location.reload();
      }
}

const app = new App()





