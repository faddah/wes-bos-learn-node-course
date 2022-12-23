import axios from "axios";
import { $ } from "./bling";

const typeAhead = search => {
	if(!search) return; 
	const searchInput = search.querySelector('input[name="search"]');
	const searchResults = search.querySelector('.search__results');
	// console.log(search, searchInput, searchResults);
	searchInput.on('input', () => {
		// if there is no value, just quit it already.
		if(!this.value) {
			searchResults.style.display = 'none';
			return; // stop!
		}
		console.log(this.value);
		// show the search results div
		searchResults.style.display = 'block';
		axios
			.get(`api/search/q?={this.value}`)
			.then(res => {
				console.log(this.value);
				// console.log(res.data);
				}
			)
	});
}


export default typeAhead;