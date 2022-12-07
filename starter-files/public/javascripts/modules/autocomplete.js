const autocomplete = (input, latInput, lngInput) => {
	// console.log(input, latInput, lngInput);
	if(!input) return // if there's no street address input, skip this function
	const dropdown = new google.maps.places.Autocomplete(input);
}

export default autocomplete;