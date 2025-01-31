import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  registerDecorator,
  Validate,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { CreateMovieDto } from './create-movie.dto';
import { PartialType } from '@nestjs/swagger';

// class-validator : 검증

// // Custom Validator 생성
// @ValidatorConstraint({
//      async : true
// })
// class PasswordValidator implements ValidatorConstraintInterface{
//     validate(value: any, validationArguments?: ValidationArguments): Promise<boolean> | boolean {
//         // 비밀번호 길이는 4 ~ 8
//         return value.length >= 4 && value.length <= 8;
//     }
//     defaultMessage?(validationArguments?: ValidationArguments): string {
//         return '비밀번호의 길이는 4~8자 이어야합니다. 입력된 비밀번호 : ($value)';
//     }
// }

// function IsPasswordValid(validationOption? : ValidationOptions){
//     return function(object : Object,propertyName : string){
//         registerDecorator({
//             target : object.constructor,
//             propertyName,
//             options : validationOption,
//             validator : PasswordValidator
//         });
//     }
// }

// Mapped Typed
// PartialType -> 기존 타입 Optional
// Pick -> Property 선택 가능
// Omit -> Pick 반대
//

export class UpdateMovieDto extends PartialType(CreateMovieDto) {
  // // Custom Validator 사용
  // @IsPasswordValid()
  // test : string;
}
