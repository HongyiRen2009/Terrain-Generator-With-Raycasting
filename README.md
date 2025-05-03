# G.R.A.S (Generative Raycasting for Advanced Surfaces)

The title, it will have mountains, lakes, oceans, snow and more.

## Implementation

Current implementation model: (if y'all have better ideas please say so)

Our world is going to consist of chunks (amount undecided) of 32x32x256 cubes/rectangular prisms. Each cube (except the edge cubes at the absolute top or bottom, or those at the edge of the world) will have 8 shared vertices, and 1 unique vertice a the center of the cube. Each vertice will have a set of attributes (x,y,z, the type of ground, a.k.a stone, grase, etc.,). Note that since each vertice is independent, it will no longer be a cube, as each vertice should have it's own distinct attributes as previously stated.

Once the vertices are calculated, a smooth curve will be calculated from the vertices (interpolation probably?). Once said smooth curve is calculated, with some basic 3d calc the normals of the thing can be calculated, which will be used for raytracing & pathtracing

## Commit Stuff.

Please follow the following naming conventions:

- **"docs:"** - Documentation changes
- **"feat:"** - New features
- **"fix:"** - Bug fixes
- **"refactor:"** - Changes that affect code organization
- **"style:"** - Changes that are formatting related (white-space, formatting, missing semi-colons, etc)
- **"test:"** - New tests or correcting existing tests
- **"perf:"** - Improves performance
- **"chore:"** - Miscellaneous changes  
  Is this tedious? Yes! Do I want to do this? No! _but_ given we will being dealing with like a billion commits (and a lot of merge conflicts) it is best to have some practice in place.
  Like you don't have to do this for like "fix spelling" But DEFINITELY for any notable change/feature/rework.
  SO DO IT!
