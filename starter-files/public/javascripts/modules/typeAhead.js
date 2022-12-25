import axios from 'axios';
import dompurify from 'dompurify';

function searchResultsHTML(stores) {
	return stores.map(store => {
		return `
				<a href="/store/${store.slug}" class="search__result">
					<strong>${store.name}</strong>
				</a>
		`;
		}).join('');
}

function typeAhead(search) {
	if(!search) return; 
	const searchInput = search.querySelector('input[name="search"]');
	const searchResults = search.querySelector('.search__results');
	// console.log(search, searchInput, searchResults);
	searchInput.on('input', function() {
		// if there is no value, just quit it already.
		if(!this.value) {
			searchResults.style.display = 'none';
			return; // stop!
		}
		// show the search results div
		searchResults.style.display = 'block';
		searchResults.innerHTML = '';
		axios
		.get(`/api/search?q=${this.value.toLowerCase()}`)
		.then(res => {
			if(res.data.length) {
				searchResults.innerHTML = dompurify.sanitize(searchResultsHTML(res.data));
				return;
			}
			// tell user nothing came back from search
			searchResults.innerHTML = dompurify.sanitize(`<div className="search__result">No search results for ${this.value}.</div>`);
		})
		.catch(err => {
			console.error(`You have an error on search: ${err}.`);
		});
});

	// handle keyboard inputs
	searchInput.on('keyup', (e) => {
		if(![38, 40, 13].includes(e.keyCode)) {
			return;  // nah, brah.
		}
		const activeClass = 'search__result--active'; 
		const current = search.querySelector(`.${activeClass}`);
		const items = search.querySelectorAll(`.search__result`);
		let next;
		/*
		switch (true) {
			case e.keyCode === 40 && current:
				next = current.nextElementSibling || items[0];
				return;
			case e.keyCode === 40:
				next = items[0];
				return;
			case e.keyCode === 38 && current:
				next = current.previousElementSibling || items[items.length - 1];
				return;
			case e.keyCode === 38:
				next = items[items.length - 1];
				return;
			case e.keyCode === 13 && current.href:
				next = items[items.length - 1];
				window.location = current.href;
				return;
			default:
				return;
		}
		*/
		if(e.keyCode === 40 && current) {
			next = current.nextElementSibling || items[0];
		} else if(e.keyCode === 40) {
			next = items[0];
		} else if (e.keyCode === 38 && current) {
			next = current.previousElementSibling || items[items.length - 1];
		} else if (e.keyCode === 38) {
			next = items[items.length - 1];
		} else if (e.keyCode === 13 && current.href) {
			window.location = current.href;
			return;
		}
		if(current) current.classList.remove(activeClass);
		next.classList.add(activeClass);
	})
}

export default typeAhead;