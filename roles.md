#### Item

Dato a  ser utilizado para probar APIS o servicios que necesiten un cierto valor de entrada.


```json
{
 "pk": "#CO#TOKEN#MI-TIGO#FOX#9c0fc448b3",
 "country": "CO",
 "typeItem": "TOKEN",
 "createdDate": 1639693386,
 "data": {
  "token": "ffaaa3445-ffdggfgfd-34342342-xafdfdsfmN"
 },
 "backendName": "FOX",
 "resourceGroup": "MI-TIGO",
 "accessGroup": "drupal"
}
````

| Propiedad | Uso | Valor Ejemplo |
| -------- | --- | -------------- |
| **accessGroup** | Los `servers` pueden acceder a los item que tengan accessGroups asociados  | drupal 
| backendName | Identificador utilizado para búsqueda  | office.colombia  |
| resourceGroup| Idenfiticador utilizado para búsqueda de item | mi-tienda |
| country | Item perteneciente a un pais | co| 
| typeItem | tipos de item | TOKEN | BASIC_CREDENTIALS | MSISDN | 
| pk       | Clave de partición, identificador univoco del item | #CO#TOKEN#MI-TIGO#FOX#9c0fc448b3

#### Users  y servers

Los `users` serían las cuentas de usuarios que hayan hecho login por medio del aws-sso.

Los `servers` serían los consumidores de algun item, limitando sus accesos
al `accessGroup` del item.

#### Roles 

Se asignará a usuarios que hayan hecho login por SSO, son los que podrian crear items y servidores


|Nombre | Scope | Ejemplo|
| ----- | ---- | ------- |
|{country}-mgr | Permiso de creación,actualización, borrado de item, y creacion,borrado de server en {country} | co-mgr
|{country}-user | Permiso de creación,actualización, borrado de item en {country}| co-user
| admin | Permiso de creacion item y server para cualquier pais | admin | 


#### User y Roles

Un usuario puede contener varios roles

| User | Roles | Group Access | TypeUser |
| ---- | -------- | ------------ | -------- |
| rodrigo.molina@meta.com | co-mgr | all | USER#ID |
| enrique.m@edge.com.py | admin | all | USER#ID |
| server-colombia@tigo.com.py |         | drupal, bits-data | SERVER#ID |
| app-tigo-id@tigo.com.py |             | tigo-id | SERVER#ID |
