/**
 * An interface that defines user context of the access control module.
 *  @interface
 */
interface IUser {
  /**
   *  Indicates the id of a user.
   *  @type {String}
   */
  id: string;

  /**
   *  Indicates a single or multiple roles assigned to the current user.
   *  @type {String|Array<String>}
   */
  roles: string[];
}

function isIUser(obj: any): obj is IUser {
  return !!obj && typeof obj.id === "string";
}

export { IUser, isIUser };
