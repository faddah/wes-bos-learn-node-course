import axios from 'axios';
import { addListener } from '../../../models/Store';
import { $ } from "./bling";

const mapOptions = {
	center: { lat: 43.2, lng: -79.8 },
	zoom: 10
}
	
function loadPlaces(map, lat = 43.2, lng = -79.8) {
	axios
	.get(`/api/stores/near?lat=${lat}&lng=${lng}`)
	.then(res => {
		const places = res.data;
		if (!places.length) {
			console.log('There were no places nearby found for that location.');
			alert('No places found!');
			return;
		}
		// create a bounds
		const bounds = new google.maps.LatLngBounds();
		const infoWindow = new google.mapsInfoWindow();

		const markers = places.map(place => {
			const [placeLng, placeLat] = place.location.coordinates;
			const position = { lat: placeLat, lng: placeLng };
			bounds.extend(position);
			const marker = new google.maps.Marker({ map, position });
			marker.place = place;
			return marker;
		});

		// when someone clicks on a marker, show the details of that place
		markers.forEach(marker => marker.addListener('click', function() {
			// console.log(this.place);
			infoWindow.setContent(this.place.name)
			infoWindow.open(map, this);
		}));

		// then zoom the map to fit all the markers perfectly
		map.setCenter(bounds.getCenter());
		map.fitBounds(bounds);
	});

}

function makeMap(mapDiv) {
	if(!mapDiv) return;
	// let us now make our map
	const map = new google.maps.Map(mapDiv, mapOptions);
	loadPlaces(map);

	const input = $('[name="geolocate"]');
	console.log(input);
	const autocomplete = new google.maps.places.Autocomplete(input);
}

export default makeMap;