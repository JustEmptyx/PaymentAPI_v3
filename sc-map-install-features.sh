#rm -rf ~/.m2/repository/by/softclub/openapi
#rm -rf /opt/nfs/cave/repo/caveRepo/by/softclub/openapi/sc-openapi-feature/2.4.0.200
if [[ -z $DEPLOY_HOST ]]; then
  DEPLOY_HOST=sc-map-asb-karaf1.softclub.by
  DEPLOY_VERSION_LIST="4.0.0.129"
  export KC_SERVER=https://open-banking-akbb.softclub.by/auth
  export KC_CLIENT_ID=SC-MAP_ADMIN-CONSOLE
  export KC_CLIENT_SECRET=24c53a42-daba-42a2-9e41-53b3e1ec0bb3
  export KC_USERNAME=sc-map
  export KC_PASSWORD=sc-map
  export KC_REALM=SCRealm
fi

echo DEPLOY_HOST = $DEPLOY_HOST
echo KC_SERVER = $KC_SERVER
echo KC_CLIENT_ID = $KC_CLIENT_ID
echo KC_USERNAME = $KC_USERNAME
echo KC_USERNAME = $KC_REALM

# Fetch ACCESS_TOKEN
KC_RESPONSE=$( \
 curl --insecure \
 -d "client_id=$KC_CLIENT_ID" \
 -d "client_secret=$KC_CLIENT_SECRET" \
 -d "username=$KC_USERNAME" \
 -d "password=$KC_PASSWORD" \
 -d "grant_type=password" \
 "$KC_SERVER/realms/$KC_REALM/protocol/openid-connect/token" \
 )
#echo $KC_RESPONSE | jq -C .
KC_ACCESS_TOKEN=$(echo $KC_RESPONSE | jq -r .access_token)

echo KC_ACCESS_TOKEN = $KC_ACCESS_TOKEN
if [[ -z $KC_ACCESS_TOKEN || $KC_ACCESS_TOKEN == 'null' ]]; then
      printf 'Feature deploy error: ACCESS TOKEN is empty!!!\n' "" >&2
      exit "1"
fi

FEATURE_NAME=sc-openapi-feature
# "2.4.0.0 3.0.0.0 9.9.0.0"
IFS=', ' read -r -a FEATURE_VERSIONS <<< "$DEPLOY_VERSION_LIST"
#echo FEATURE_VERSIONS="$FEATURE_VERSIONS"
CAVE_HOST_PORT=sc-map-asb-karaf1.softclub.by:18181
#file:/opt/karaf/data/cave/caveRepo/by/softclub/openapi/sc-openapi-feature/2.4.0.52/sc-openapi-feature-2.4.0.52.kar
#     "http://$DEPLOY_HOST:8103/sys/karupdate?kar.name=$FEATURE_NAME/$FEATURE_VERSION/$FEATURE_NAME-$FEATURE_VERSION.kar" \
for i in "${FEATURE_VERSIONS[@]}"
do
   :
    FEATURE_VERSION=$i
    echo $(date '+%d/%m/%Y %H:%M:%S') Start deploy kar.name=$FEATURE_NAME/$FEATURE_VERSION/$FEATURE_NAME-$FEATURE_VERSION.kar
    echo "http://$DEPLOY_HOST:8103/sys/karupdate?kar.name=http://$CAVE_HOST_PORT/cave/maven/repositories/caveRepo/by/softclub/openapi/$FEATURE_NAME/$FEATURE_VERSION/$FEATURE_NAME-$FEATURE_VERSION.kar"
    KC_RESPONSE=$( \
     curl --insecure -X GET \
     -H "Authorization: Bearer $KC_ACCESS_TOKEN" \
     -H "Accept: application/json, text/plain, */*" \
     -H "Accept: application/json, text/plain, */*" \
     -H "content-type: application/json" \
     -H "Accept-Language: ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3" --compressed  \
     "http://$DEPLOY_HOST:8103/sys/karupdate?kar.name=http://$CAVE_HOST_PORT/cave/maven/repositories/caveRepo/by/softclub/openapi/$FEATURE_NAME/$FEATURE_VERSION/$FEATURE_NAME-$FEATURE_VERSION.kar" \
     )
    echo KC_RESPONSE = ${KC_RESPONSE}

    if [[ -z $KC_RESPONSE ]]; then
      printf 'Feature deploy response is empty!!!\n' "1" >&2
      exit "2"
    fi


    #.error_type == Uninstall features before installing KAR:
    install_result=$( \
      echo ${KC_RESPONSE}  | jq -r .[0][0].installed \
    )
    #install_result="Uninstall features before installing KAR:"
    if [ "$install_result" = "false" ]; then
      #get feature for uninstall
      feature_name=$( \
        echo ${KC_RESPONSE}  | jq -r .[0][0].name \
      )
      feature_version=$( \
        echo ${KC_RESPONSE}  | jq -r .[0][0].version \
      )
      #uninstall feature
      KC_RESPONSE=$( \
      curl --insecure -X GET \
         -H "Authorization: Bearer $KC_ACCESS_TOKEN" \
         -H "Accept: */*" \
         -H "Cache-Control: no-cache" \
         -H "Connection: keep-alive" \
        "http://$DEPLOY_HOST:8103/sys/featureuninstall?feature.name=$feature_name&feature.version=$feature_version"
       )
      echo KC_RESPONSE = ${KC_RESPONSE}
      echo "http://$DEPLOY_HOST:8103/sys/karupdate?kar.name=http://$CAVE_HOST_PORT/cave/maven/repositories/caveRepo/by/softclub/openapi/$FEATURE_NAME/$FEATURE_VERSION/$FEATURE_NAME-$FEATURE_VERSION.kar"
      #install feature again
      KC_RESPONSE=$( \
       curl --insecure -X GET \
       -H "Authorization: Bearer $KC_ACCESS_TOKEN" \
       -H "Accept: application/json, text/plain, */*" \
       -H "content-type: application/json" \
       -H "Accept-Language: ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3" --compressed  \
       "http://$DEPLOY_HOST:8103/sys/karupdate?kar.name=http://$CAVE_HOST_PORT/cave/maven/repositories/caveRepo/by/softclub/openapi/$FEATURE_NAME/$FEATURE_VERSION/$FEATURE_NAME-$FEATURE_VERSION.kar" \
       )
      echo KC_RESPONSE = ${KC_RESPONSE}
    fi
done
