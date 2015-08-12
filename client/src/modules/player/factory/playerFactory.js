Trio.Module.export('playerFactory', function() {
    var PlayerFactory = Trio.Factory.extend({
        defaults: {
            lastName: 'James',
            firstName: 'LeBron',
            jerseyNumber: 23,
            dateOfBirth: 473241600000,
            avatarUrl: 'http://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/1966.png&w=350&h=254',
            height: 80,
            weight: 250,
            placeOfBirth: 'Akron, OH',
            university: 'St-Vincent St-Mary',
            position: 'SF',
            team: 'Cleveland',
            morale: 'Happy',
            fatigue: 'Fresh',
            salary: 22250000,
            contractLength: 2,
            contractAmount: 50000000
        },

        initialize: function() {
            var player = Trio.Resource.get('playerResource');

            // player.createOne(this.createRandomPlayer())
            //         .then(function(d) {
                        this.sync(player, 'iRZ8cwPZQI');

                        player.readOne('iRZ8cwPZQI')
                            .then(function(rsp) {
                                this.setAll(rsp[0])
                            }.bind(this));

                    // }.bind(this));
        },

        createRandomPlayer: function() {
            var salary = generateRandom(150000, 4000000);
            return ({
                lastName: randLastName(),
                firstName: randFirstName(),
                jerseyNumber: generateRandom(0, 99),
                dateOfBirth: generateRandom(now() - 630720000000, now() - 567648000000),
                avatarUrl: 'https://pixabay.com/static/uploads/photo/2014/04/02/11/02/man-305295_640.png',
                height: generateRandom(65, 90),
                weight: generateRandom(180, 350),
                placeOfBirth: randCities(),
                university: pickRandom(['UCSD', 'UCLA', 'UC Berkeley', 'Harvard', 'Duke', 'Kentucky', 'Penn State']),
                position: pickRandom(['PG', 'SG', 'SF', 'PF', 'C']),
                team: 'N/A',
                morale: 'Happy',
                fatigue: 'Fresh',
                salary: salary,
                contractLength: 1,
                contractAmount: salary,
                attributes: {
                    "layup": generateRandom(40, 75),
                    "dunk": generateRandom(40, 75),
                    "shotShort": generateRandom(40, 75),
                    "shotLong": generateRandom(40, 75),
                    "shotMid": generateRandom(40, 75),
                    "shotInTraffic": generateRandom(40, 75),
                    "shotPost": generateRandom(40, 75),
                    "handling": generateRandom(40, 75),
                    "ballSecurity": generateRandom(40, 75),
                    "pass": generateRandom(40, 75),
                    "block": generateRandom(40, 75),
                    "steal": generateRandom(40, 75),
                    "hands": generateRandom(40, 75),
                    "perimeterDefense": generateRandom(40, 75),
                    "lowPostDefense": generateRandom(40, 75),
                    "defensiveRebound": generateRandom(40, 75),
                    "offensiveRebound": generateRandom(40, 75),
                    "offBallDefense": generateRandom(40, 75),
                    "offBallDefense": generateRandom(40, 75),
                    "consistence": generateRandom(40, 75),
                    "stamina": generateRandom(40, 75),
                    "speed": generateRandom(40, 75),
                    "quickness": generateRandom(40, 75),
                    "vertical": generateRandom(40, 75),
                    "durability": generateRandom(40, 75),
                    "potential": generateRandom(40, 75),
                    "emotion": generateRandom(40, 75)
                }
            });

            function generateRandom(start, end) {
                return Math.floor(Math.random() * (end + 1 - start)) + start;
            }

            function pickRandom(array) {
                return array[Math.floor(Math.random() * array.length)];
            }

            function now() {
                return new Date().getTime();
            }

            function randCities() {
                var cities = ["Modesto", "San Bernardino", "Phoenix", "Greensboro", "North Hempstead", "Santa Ana", "Montgomery", "Huntington", "Jersey City", "Arlington", "Sacramento", "Corpus Christi", "Tucson", "Riverside", "Henderson", "Akron", "New Orleans", "Oakland", "Garland", "Orlando", "San Diego", "Mesa", "Seattle", "Long Beach", "Toledo", "Tulsa", "Newark", "Nashville-Davidson", "Washington", "Rochester", "Portland", "Oklahoma City", "Hialeah", "Reno", "Los Angeles", "Austin", "St. Paul", "Laredo", "Birmingham", "Atlanta", "Dallas", "St. Louis", "Raleigh", "San Antonio", "Lexington-Fayette", "Baltimore", "St. Petersburg", "Wichita", "Detroit", "Durham", "Glendale", "Lubbock", "Charlotte", "Plano", "Fort Worth", "Honolulu", "Chesapeake", "Madison", "Las Vegas", "Minneapolis", "Boise", "Tampa", "Indianapolis", "Memphis", "San Jose", "Miami", "Omaha", "Baton Rouge", "Chula Vista", "Arlington", "Fresno", "Philadelphia", "El Paso", "Chicago", "Chandler", "Pittsburgh", "Houston", "Lincoln", "Denver", "New York", "Virginia Beach", "Boston", "Cleveland", "Anchorage", "Cincinnati", "Anaheim", "Stockton", "Buffalo", "Norfolk", "Scottsdale", "Albuquerque", "Fort Wayne", "Milwaukee", "Columbus", "Kansas City", "Bakersfield", "San Francisco", "Colorado Springs", "Jacksonville", "Aurora"];
                return pickRandom(cities);
            }   

            function randLastName() {
                var lastName = ['Donat','Bonfiglio','Rauch','Heatley','Fullenwider','Boyles','Barbeau','Vonruden','Givan','Dacosta','Dailey','Keena','Ikner','Stangle','Clopton','Magnus','Almy','Reynosa','Sholtis','Fason','Deberry','Egner','Gillard','Swarts','Weedon','Troutman','Thornsberry','Harjo','Mattei','Knapper','Kuhlmann','Garraway','Ochs','Richins','Blagg','Vandervort','Cobos','Matt','Alsup','Stone','Steffensmeier','Balis','Pidgeon','Seelig','Mceachin','Jump','Lippincott','Vallone','Hennessy','Nicolas'];
                return pickRandom(lastName);
            }

            function randFirstName() {
                var firstName = ['Olin','Kelley','Manual','Garfield','Hank','Trey','Bradley','Jarrod','Sandy','Whitney','Gilbert','Otis','Johnathon','Elvin','Waylon','Shad','Jeremy','Brock','Elias','Daren','Tad','Deangelo','Shon','Valentine','Everett','Carmen','Elliot','Diego','Gerard','Sylvester','Jacinto','Amado','Benito','Rodrigo','Jared','Zane','Norris','Lacy','Dong','Donovan','Rayford','Chong','Joe','Allan','Wesley','Corey','Emil','Gale','Ben'];
                return pickRandom(firstName);
            }
        },

        setAll: function(d) {
            this.setTitle(d);
            this.setVital(d);
            this.setPlayerInfo(d);
            this.setAttributes(d);
            this.eventBus.publish('update:player');
        },

        setTitle: function(d) {
            this.fullTitle = d.firstName + ' <span class="jersey-number">' + d.jerseyNumber + '</span> ' + d.lastName;
        },

        setVital: function(d) {
            this.vital = [
                {
                    title: 'Age',
                    value: '' + Math.floor((new Date().getTime() - d.dateOfBirth)/31536000000)
                },
                {
                    title: 'Height',
                    value: '' + Math.floor(d.height/12) + 'ft' + d.height % 12
                },
                {
                    title: 'Weight',
                    value: d.weight + 'lb'
                },
                {
                    title: 'From',
                    value: d.placeOfBirth
                }
            ];
        },

        setAttributes: function(d) {
            var sum = 0;
            var total = 0;
            for (var attr in d.attributes) {
                sum += d.attributes[attr];
                total++;
            }
            this.playerAttributes = {
                overall: Math.floor(sum/total)
            }
        },

        setPlayerInfo: function(d) {
            this.playerInfo = {
                avatarUrl: d.avatarUrl,
                playerInfo: [
                    {
                        name: 'POSITION',
                        val: d.position
                    },
                    {
                        name: 'TEAM',
                        val: d.team
                    },
                    {
                        name: 'MORALE',
                        val: d.morale
                    },
                    {
                        name: 'FATIGUE',
                        val: d.fatigue
                    },
                    {
                        name: 'SALARY',
                        val: convertMillions(d.salary)
                    },
                    {
                        name: 'CONTRACT',
                        val: d.contractLength + 'YR ' + convertMillions(d.contractAmount)
                    },
                ]
            }
        }
    });

    return PlayerFactory;

    function convertMillions(num) {
        return '$' + Math.floor(num/1000000) + '.' + Math.floor(num%1000000/10000) + 'M'
    }
});