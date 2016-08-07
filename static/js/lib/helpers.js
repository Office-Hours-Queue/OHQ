function get_index_by_id(elements, id) {
	for (var i = 0; i < elements.length; i++) {
		if (elements[i].id == id) {
			return i
		}
	}
	return -1
}