#!/bin/bash

# Start MongoDB in the background
mongod --replSet rs0 --bind_ip_all --fork --logpath /var/log/mongodb.log

echo "Waiting for mongo1 to be ready..."
until mongosh --host localhost --eval "print('mongo1 ready')" >/dev/null 2>&1; do sleep 2; done

echo "Waiting for mongo2 to be reachable..."
until mongosh --host mongo2 --eval "print('mongo2 up')" >/dev/null 2>&1; do sleep 2; done

echo "Waiting for mongo3 to be reachable..."
until mongosh --host mongo3 --eval "print('mongo3 up')" >/dev/null 2>&1; do sleep 2; done

echo "Initiating replica set..."

mongosh --host localhost <<EOF
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongo1:27017" },
    { _id: 1, host: "mongo2:27017" },
    { _id: 2, host: "mongo3:27017" }
  ]
})
EOF

# Keep container alive
tail -f /dev/null
