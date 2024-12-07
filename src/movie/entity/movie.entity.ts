import { Exclude, Expose, Transform } from "class-transformer";

// @Exclude() : 조회시 해당 propeety 숨김
// @Expose() : 조회시 해당 property 노출

// @Exclude()
 export class Movie {

   // @Expose()
   id : number;
   // @Expose()
   title : string;
    
   //  @Expose()
   //  @Exclude()
   @Transform(
      ({value}) => value.toString().toUpperCase(),
   )
    genre : string;
 
   // @Expose()
   // get description(){
   //    return `id : ${this.id} , title : ${this.title}`;
   // }   
}

 