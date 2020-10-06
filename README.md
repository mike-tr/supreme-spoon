Explanation how to run:

https://screepers.gitbook.io/screeps-typescript-starter/getting-started/deploying


About:
This is my bot, first step i want to generate an automatic base builder.

The algorithem for that will be as follows:

Get terrain data and generate a map, with a center point ( would be the first spawn, how to find the best starting spawn point would be another thing by itself )
the map only cares about natural walls, resources, controller.
it would mark all of the above as not open and unwalkable.

next step for each of those, mark the nighbours that they have "closed" space near them, marking tiles with more then x ( 1 to 8 ) "taken" spaces as closed ( not buildable ).

Generating 500 buildings with the rule of "needs 4 free spaces near building"
https://i.gyazo.com/5029a2f94c77e0e4fe5789f46b10c376.png


next step we generate a cost map for all tiles in the map.
cost from the "ceneter" a.k.a starting spwan.

we mark tiles with cost less then Y as buildable and drop them in open set.
we mark tiles with cost > Y && cost < Y + 20 as "edges"

next : 
we generate W buildings, ( max number ) on the open set.

for each new building we make sure it doesnt break the following rules.

if any building b in Buildings now has a cost > G, or any edge e has cost > G
we revert back and mark the tile as not buildable.

in case it didn't break those rules we add the tile in buildings, and remove from open.



Next step:
We generate the buildings we need ( labs, tower, extentions , etc...) on tiles in buildings list.
based on other rules! 
(a.k.a labs would take 10 tiles with max range of 2 from each other or something like dat ).
(storage & link would be in range of 1 from spawn ... )
