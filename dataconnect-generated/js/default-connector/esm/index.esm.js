import { queryRef, executeQuery, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'default',
  service: 'zappy-health-api',
  location: 'us-central1'
};

export const listUsersRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'listUsers');
}
listUsersRef.operationName = 'listUsers';

export function listUsers(dc) {
  return executeQuery(listUsersRef(dc));
}

