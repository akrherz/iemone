
# build
npm run build
# Check if the build was successful
if [ $? -ne 0 ]; then
    echo "Build failed, exiting."
    exit 1
fi

# Rsync content to the IEM webfarm
for i in {35..44}; do
    echo "Deploying to IEMVS${i}-DC"
    rsync -av ./dist/* mesonet@iemvs${i}-dc:/opt/iem/htdocs/one/
done