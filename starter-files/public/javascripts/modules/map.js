import axios from 'axios';
import { $ } from "./bling";

const mapOptions = {
	center: {
		lat: 43.2,
		lng: -79.8
	},
	zoom: 7
}

const loadPlaces = (map, lat = 43.2, lng = -79.8) => {

}

const makeMap = mapDiv => {
	if(!mapDiv) return;
	// let us now make our map
	const map = new google.maps.Map(mapDiv, mapOptions);
	const input = $('[name="geolocate]');
	console.log(input);
}

export default makeMap;