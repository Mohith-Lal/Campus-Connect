const campusLocations = [
  {
    id: 'b-s-narayan-block',
    name: 'B. S. Narayan Block',
    position: [13.1339700, 77.5680600],
    category: 'Academic Blocks',
    description: 'An academic block at BMS Institute of Technology and Management.',
    facilities: [],
  },
  {
    id: 'sir-c-v-raman-block',
    name: 'Sir C. V. Raman Block',
    position: [13.1343546, 77.5681584],
    category: 'Academic Blocks',
    description: 'An academic block at BMS Institute of Technology and Management.',
    facilities: [],
  },
  {
    id: 'silver-jubilee-block',
    name: 'Silver Jubilee Block',
    position: [13.1333800, 77.5670800],
    category: 'Academic Blocks',
    description: 'An academic block at BMS Institute of Technology and Management.',
    facilities: [],
  },
  {
    id: 'car-parking',
    name: 'Car Parking',
    position: [13.1341930, 77.5690150],
    category: 'Parking',
    description: 'Designated parking area for cars.',
    facilities: [],
  },
  {
    id: 'boys-hostel',
    name: "Boys' Hostel",
    position: null,
    category: 'Facilities',
    description: 'Student accommodation facility.',
    facilities: [],
  },
  {
    id: 'playground',
    name: 'Playground',
    position: [13.1342932, 77.5673912],
    category: 'Sports',
    description: 'Outdoor recreation and sports area.',
    facilities: [],
  },
  {
    id: 'volleyball-basketball-court',
    name: 'Volleyball & Basketball Court',
    position: [13.1330038, 77.5691360],
    category: 'Sports',
    description: 'Outdoor courts for volleyball and basketball.',
    facilities: [],
  },
  {
    id: 'kaapi-kuteera',
    name: 'Kaapi Kuteera',
    position: [13.1328305, 77.5697677],
    category: 'Food',
    description: 'Campus food and refreshment spot.',
    facilities: [],
  },
  {
    id: 'bike-parking',
    name: 'Bike Parking',
    position: [13.1334580, 77.5692319],
    category: 'Parking',
    description: 'Designated parking area for bikes.',
    facilities: [],
  },
  {
    id: 'bmssa-block-1',
    name: 'BMSSA Block 1',
    position: [13.1325644, 77.5685795],
    category: 'Academic Blocks',
    description: 'Academic block at BMS Institute of Technology and Management.',
    facilities: [],
  },
  {
    id: 'bmssa-block-2',
    name: 'BMSSA Block 2',
    position: [13.1327188, 77.5680068],
    category: 'Academic Blocks',
    description: 'Academic block at BMS Institute of Technology and Management.',
    facilities: [],
  },
  {
    id: 'sir-m-v-block',
    name: 'Sir M. V. Block',
    position: [13.1334378, 77.5674231],
    category: 'Academic Blocks',
    description: 'Academic block at BMS Institute of Technology and Management.',
    facilities: [],
  },
]

export function searchCampusLocations(searchTerm, category) {
  const normalizedSearch = searchTerm.trim().toLowerCase()

  return campusLocations.filter((location) => {
    const matchesCategory = !category || location.category === category
    const searchableFields = [
      location.name,
      location.category,
      location.description,
      ...(location.facilities ?? []),
    ]
    const matchesSearch =
      !normalizedSearch ||
      searchableFields.some((field) => field.toLowerCase().includes(normalizedSearch))

    return matchesCategory && matchesSearch
  })
}

export default campusLocations
